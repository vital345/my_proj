import { Part } from "@google/generative-ai";
import { EventEmitter } from "eventemitter3";
import { difference } from "lodash";
import { SETTINGS } from "../../conf/settings";
import {
  FunctionResponseType,
  isFunctionCall,
  isGoAway,
  isInterrupted,
  isModelTurn,
  isSessionResumptionMessage,
  isSetupCompleteMessage,
  isToolCallCancellationMessage,
  isToolCallMessage,
  isTurnComplete,
  LiveIncomingMessage,
  ModelTurn,
  SendTextType,
  ServerContent,
  SessionResumption,
  StreamingLog,
  ToolCall,
  ToolCallCancellation,
  type LiveConfig,
} from "../multimodal-live-types";
import { base64ToArrayBuffer } from "./utils";

/**
 * the events that this client will emit
 */
interface MultimodalLiveClientEventTypes {
  open: () => void;
  log: (log: StreamingLog) => void;
  close: (event: CloseEvent) => void;
  audio: (data: ArrayBuffer) => void;
  content: (data: ServerContent) => void;
  interrupted: () => void;
  setupcomplete: () => void;
  turncomplete: () => void;
  toolcall: (toolCall: ToolCall) => void;
  toolcallcancellation: (toolcallCancellation: ToolCallCancellation) => void;
  apiKeyError: string;
  transcriptEvent: string;
  goAway: (data: string) => void;
  sessionResumptionUpdate: (data: SessionResumption) => void;
  functioncall: (toolCall: ToolCall) => void;
}

export type MultimodalLiveAPIClientConnection = {
  url?: string;
  apiKey: string;
};

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class MultimodalLiveClient extends EventEmitter<MultimodalLiveClientEventTypes> {
  public ws: WebSocket | null = null;
  protected config: LiveConfig | null = null;
  public url: string = SETTINGS.GEMINI_HOME_URL;
  public getConfig() {
    return { ...this.config };
  }

  constructor() {
    super();
    this.sendText = this.sendText.bind(this);
  }

  log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  connect(config: LiveConfig) {
    this.config = config;

    const ws = new WebSocket(this.url);

    ws.addEventListener("message", async (evt: MessageEvent) => {
      const message = JSON.parse(evt.data);
      if (message?.status && message.status === "connected") {
        this.emit("setupcomplete");
      }
      if (typeof evt.data === "string") {
        await this.receive(evt.data);
      } else {
        console.log("non string message", evt);
      }
    });

    ws.onopen = () => {
      if (!this.config) {
        console.error("Config not set!");
        ws.close();
      }

      this.ws = ws;
      ws.send(
        JSON.stringify({
          config: this.config,
          vertex_ai: false,
          model: SETTINGS.GEMINI_MODEL,
        })
      );
    };
  }

  disconnect(ws?: WebSocket) {
    // could be that this is an old websocket and theres already a new instance
    // only close it if its still the correct reference
    if ((!ws || this.ws === ws) && this.ws) {
      console.log("client disconnected.");
      this.ws.close();
      this.ws = null;
      this.log("client.close", `Disconnected`);
      return true;
    }
    return false;
  }

  protected async receive(blob: string) {
    const response: LiveIncomingMessage = JSON.parse(
      blob
    ) as LiveIncomingMessage;
    if (isFunctionCall(response)) {
      this.log("function call", response);
      this.emit("functioncall", response as unknown as ToolCall);
      return;
    }

    if (isToolCallMessage(response)) {
      this.log("server.toolCall", response);
      this.emit("toolcall", response.toolCall);
      return;
    }
    if (isToolCallCancellationMessage(response)) {
      this.log("receive.toolCallCancellation", response);
      this.emit("toolcallcancellation", response.toolCallCancellation);
      return;
    }

    if (isSetupCompleteMessage(response)) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }

    if (isGoAway(response)) {
      console.log(response?.time_left);
      this.emit("goAway", response?.time_left);
      return;
    }

    if (isSessionResumptionMessage(response)) {
      this.emit("sessionResumptionUpdate", response);
      return;
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    const serverContent = response;
    if (isInterrupted(serverContent)) {
      this.log("receive.serverContent", "interrupted");
      this.emit("interrupted");
      return;
    }

    if (isTurnComplete(serverContent)) {
      this.log("server.send", "turnComplete");
      this.emit("turncomplete");
      //plausible theres more to the message, continue
    }

    if (isModelTurn(serverContent)) {
      let parts: Part[] = serverContent.model_turn?.parts || [];

      // when its audio that is returned for modelTurn
      const audioParts = parts.filter(
        (p: any) =>
          p.inline_data && p.inline_data.mime_type.startsWith("audio/pcm")
      );
      const base64s = audioParts.map((p: any) => p.inline_data?.data);

      // strip the audio parts out of the modelTurn
      const otherParts = difference(parts, audioParts);
      // console.log("otherParts", otherParts);

      base64s.forEach((b64) => {
        if (b64) {
          const data = base64ToArrayBuffer(b64);
          this.emit("audio", data);
          this.log(`server.audio`, `buffer (${data.byteLength})`);
        }
      });

      if (!otherParts.length) {
        return;
      }

      parts = otherParts;

      const content: ModelTurn = { model_turn: { parts } };
      this.emit("content", content);
      this.log(`server.content`, response);
    }
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: FunctionResponseType) {
    const message = {
      ...toolResponse,
    };

    this._sendDirect(message);
    this.log(`client.toolResponse`, JSON.stringify(message));
  }

  /**
   * send normal content parts such as { text }
   */
  sendText(parts: SendTextType) {
    parts.turn_complete =
      typeof parts.turn_complete !== "undefined" ? parts.turn_complete : true;
    // parts.role = parts.role || "user";
    const stringParts = JSON.stringify(parts);

    this._sendDirect(parts);
    this.log(`client.send`, stringParts);
  }

  send(payload: string) {
    if (!this.ws) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(payload);
  }

  /**
   *  used internally to send all messages
   *  don't use directly unless trying to send an unsupported message type
   */
  _sendDirect(request: object) {
    if (!this.ws) {
      throw new Error("WebSocket is not connected");
    }
    const str = JSON.stringify(request);
    this.ws.send(str);
  }
}
