import asyncio
import json
import os
import traceback
from dotenv import load_dotenv
from fastapi.websockets import WebSocketState
from google.genai import types
from google.genai.live import AsyncSession
from typing import List, Optional
import logging
from fastapi import WebSocket, WebSocketDisconnect
import random

from google import genai
from pydantic import ValidationError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


class GeminiHandler:
    """
    Handles real-time streaming between a WebSocket client and Gemini live session.
    Supports both audio (binary) and text (string) messages.
    """

    def __init__(
        self,
        websocket: WebSocket,
        model: str = "gemini-2.0-flash-live-preview-04-09",
        CONFIG: dict = {"response_modalities": ["TEXT"]},
    ):
        self.websocket = websocket
        self.model = model
        self.CONFIG = CONFIG
        self.in_queue: asyncio.Queue = asyncio.Queue(maxsize=10)
        self.out_queue: asyncio.Queue = asyncio.Queue(maxsize=10)
        self.session: Optional[AsyncSession | None] = None
        self.tasks: List[asyncio.Task] = []
        self.vertex_ai = True
        self.gemini_client = genai.Client(
            vertexai=True,
            http_options=types.HttpOptions(api_version="v1beta1"),
            location=os.environ["GCP_LOCATION"],
            project=os.environ["GCP_PROJECT"],
        )
        self._ready = asyncio.Event()

    def __is_vertex_ai(self, vertex_ai: bool = True):
        """
        Check if the client want to connect Vertex AI.
        """
        if not vertex_ai:
            if keys := os.environ.get("GEMINI_API_KEY"):
                keys: list = json.loads(keys)
                client = genai.Client(api_key=random.choice(keys))
                return client
            logger.info("No Gemini Keys found -> Using vertex ai only")
            self.model = "gemini-2.0-flash-live-preview-04-09"
            self.websocket.send_json({
                "message": "USING_VERTEX_AI",
                "reason": "Missing GEMINI_API_KEY env variable"
            })
        return self.gemini_client

    async def disconnect(self):
        """
        Close session and cancel background tasks.
        """
        print("Disconnecting...")
        if self.session:
            await self.session.close()
            logger.info("Gemini handler disconnected")
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        if self.websocket.client_state == WebSocketState.CONNECTED:
            await self.websocket.close()

    async def receive_from_ws(self):
        while True:
            msg = await self.websocket.receive()

            if blob_data := msg.get("bytes"):
                await self.in_queue.put(
                    types.Blob(data=blob_data, mime_type="audio/pcm;rate=16000")
                )
                continue
            elif isinstance(msg.get("text"), str):
                raw_data = msg["text"]
                json_data: dict = json.loads(raw_data)
                if "tool" in json_data:
                    function_response = []
                    for tool in json_data["tool"]:
                        function_response.append(
                            types.FunctionResponse(
                                name=tool["name"],
                                response=tool["response"],
                                id=tool.get("id"),
                            )
                        )

                    await self.session.send_tool_response(
                        function_responses=function_response
                    )
                elif "message" in json_data:
                    await self._send_user_turn(
                        json_data["message"],
                        json_data["turn_complete"],
                        json_data.get("role", "user"),
                    )
                else:
                    await self._send_user_turn(raw_data)

    async def _send_user_turn(
        self, text: str, turn_complete: bool = True, role: str = "user"
    ):
        content = types.Content(role=role, parts=[types.Part(text=text)])
        await self.session.send_client_content(
            turns=content, turn_complete=turn_complete
        )

    async def send_to_ws(self):
        """
        Send audio/text responses from Gemini back to the WebSocket client.
        """
        try:
            # await self._ready.wait()  # Wait for the session to be ready
            while True:
                chunk = await self.out_queue.get()
                if isinstance(chunk, (bytes, bytearray)):
                    await self.websocket.send_bytes(chunk)
                else:
                    await self.websocket.send_text(chunk)
        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected (send)")
        except Exception as e:
            traceback.print_exc()

    async def send_to_gemini(self):
        """
        Forward audio blobs from in_queue to Gemini live session.
        """
        try:
            # await self._ready.wait()  # Wait for the session to be ready
            while True:
                blob = await self.in_queue.get()
                await self.session.send_realtime_input(media=blob)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            traceback.print_exc()

    async def receive_from_gemini(self):
        """
        Read streaming responses from Gemini and enqueue for WebSocket.
        """
        try:

            while True:
                async for response in self.session.receive():

                    for key, data in response.dict(
                        exclude_none=True, exclude={"usage_metadata"}
                    ).items():
                        if key == "server_content":
                            self.out_queue.put_nowait(response.server_content.json())
                        else:
                            await self.websocket.send_json(data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            traceback.print_exc()

    async def run(self):
        """
        Start all background tasks and wait for them to complete.
        """
        await self.websocket.accept()
        try:
            recieved_config: dict = await asyncio.wait_for(
                self.websocket.receive_json(), timeout=10.0
            )
            logger.info(f"Received config: {recieved_config}")
            self.model = recieved_config.pop("model", None) or self.model
            self.gemini_client = self.__is_vertex_ai(
                recieved_config.pop("vertex_ai", True)
            )
            if "config" in recieved_config:
                self.CONFIG = recieved_config["config"]
                await self.websocket.send_json(
                    {
                        "status": "connecting",
                        "message": "Using provided config",
                        "config": self.CONFIG,
                    }
                )
                try:
                    types.LiveConnectConfig.model_validate(self.CONFIG)
                except ValidationError as e:
                    print("Config invalid:", e.json())
                    await self.websocket.send_json(
                        {
                            "status": "error",
                            "message": "Invalid config",
                            "error": e.errors(),
                        }
                    )

            else:
                print("No config provided")
                await self.websocket.send_json(
                    {
                        "status": "failed",
                        "message": "No config found",
                        "format": types.LiveConnectConfig.model_json_schema(),
                    }
                )
        except asyncio.TimeoutError:
            await self.websocket.send_json(
                {
                    "status": "connecting",
                    "message": "Using default config",
                    "config": self.CONFIG,
                }
            )

        async with self.gemini_client.aio.live.connect(
            model=self.model, config=self.CONFIG
        ) as session:
            self.session: AsyncSession = session
            await self.websocket.send_json({"status": "connected"})
            logger.info("Gemini session started")
            # self._ready.set()

            self.tasks = [
                asyncio.create_task(self.receive_from_ws()),
                asyncio.create_task(self.send_to_gemini()),
                asyncio.create_task(self.receive_from_gemini()),
                asyncio.create_task(self.send_to_ws()),
            ]
            await asyncio.wait(self.tasks, return_when=asyncio.FIRST_COMPLETED)

            await self.disconnect()
