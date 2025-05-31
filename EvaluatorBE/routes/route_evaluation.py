import asyncio
from datetime import datetime
import os
import time
import traceback
from typing import Literal, Optional

import boto3
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
)
from sqlalchemy import create_engine
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from sqlalchemy import delete

from core.config import Settings
from core.jwt import create_access_token
from db.models.chat_history import ChatHistory
from db.models.chat_session import ChatSession
from db.models.evaluation import Evaluation
from db.models.evaluation_step import EvaluationStep
from db.models.user import User
from db.models.user_evaluation import UserEvaluation
from db.repository.evaluation_repository import (
    create_evaluation,
    get_all_evaluations,
    get_evaluation_status_of_user,
    get_single_evaluation_by_id,
    update_evaluation_step,
)
from db.session import get_db
from routes.route_login import get_current_user
from schemas.evaluation import (
    CreateEvaluationRequest,
    StartEvaluationRequest,
    UploadCompleteRequest,
    VideoRecord,
)
from schemas.qa import InputQuestion, QARequest
from services.ai.agents.generate_domain_specific_question import question_generator
from services.ai.multimodal.multimodal import GeminiHandler
from services.core.evaluations.qa.v1.qa import qa
from services.core.evaluations.qa.v2.qa import qa as qa_v2
from services.core.evaluations.qa.v3.get_queue import ConnectionManager, get_question_from_queue
from services.core.evaluations.qa.v3.qa import (
    qa_v3_get_questions,
    qa_v3_submit_answer,
    qa_v3_submit_question,
)
from services.core.evaluations.take_evaluation import (
    get_evalution_id,
    process_all_evaluations,
    take_evaluation,
)
from services.core.evaluations.send_viva_mail_to_user import send_viva_mail_to_user
from services.core.mails import send_email
import websockets
from db.session import engine
from botocore.exceptions import ClientError

load_dotenv()

router = APIRouter()


unauthorized_exception: HTTPException = HTTPException(
    status_code=403,
    detail={
        "status": "unauthorized",
        "errors": [
            "User is not authorized to perform this action",
            "User is not an admin",
        ],
    },
)


@router.post("/")
async def create_an_evaluation(
    request: CreateEvaluationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    if user.role != "admin":
        raise unauthorized_exception

    created_evaluation = create_evaluation(request, db)
    user_eval_ids = []
    for user in created_evaluation.users:
        print("Scheduling evaluation for user")
        print(user)
        userEvaluation: UserEvaluation = (
            db.query(UserEvaluation)
            .where(UserEvaluation.user_id == user.id)
            .where(UserEvaluation.evaluation_id == created_evaluation.id)
            .first()
        )
        # background_tasks.add_task(
        #     take_evaluation_sync, userEvaluation=userEvaluation, db=db
        # )
        user_eval_ids.append(userEvaluation.id)
    asyncio.create_task(process_all_evaluations(user_eval_ids, request.extensions))

    return created_evaluation


@router.post("/start-single/")
async def start_evaluation_for_single_user(
    request: StartEvaluationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Retrieve the evaluation record
    evaluation = (
        db.query(Evaluation).filter(Evaluation.id == request.evaluation_id).first()
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    # Retrieve the user record by email
    target_user = db.query(User).filter(User.username == request.email).first()
    if not target_user:
        raise HTTPException(
            status_code=404, detail="User not found with the provided email"
        )

    # Retrieve the specific user evaluation record
    user_evaluation = (
        db.query(UserEvaluation)
        .filter(
            UserEvaluation.evaluation_id == evaluation.id,
            UserEvaluation.user_id == target_user.id,
        )
        .first()
    )
    if not user_evaluation:
        raise HTTPException(status_code=404, detail="User evaluation record not found")

    # Schedule the background task to process the evaluation
    # background_tasks.add_task(take_evaluation_sync, userEvaluation=user_evaluation, db=db)
    asyncio.create_task(take_evaluation(user_evaluation.id, request.extensions))

    return {
        "msg": "Evaluation started for user",
        "evaluation_id": evaluation.id,
        "email": request.email,
    }


@router.get("/reopen/{user_evaluation_id}/")
async def reopen_evaluation(
    user_evaluation_id: int,
    email: str,
    send_viva_link: Optional[bool] = False,
    step_name: Optional[
        Literal[
            "backend_test_execution_report",
            "code_quality_report",
            "milestone_wise_report",
            "commit_message_evaluation_report",
            "VIVA",
        ]
    ] = "VIVA",
    db: Session = Depends(get_db),
):
    user_evaluation = (
        db.query(UserEvaluation).filter(UserEvaluation.id == user_evaluation_id).first()
    )
    if not user_evaluation:
        raise HTTPException(status_code=404, detail="User evaluation record not found")

    if step_name == "VIVA":
        db.execute(
            delete(EvaluationStep).where(
                EvaluationStep.userevaluation_id == user_evaluation_id,
                EvaluationStep.step_name.in_(
                    ["domain_specific_qa", "project_specific_qa"]
                ),
            )
        )
        db.commit()

        chatSession: ChatSession = (
            db.query(ChatSession)
            .where(ChatSession.userevaluation_id == user_evaluation_id)
            .first()
        )
        if not chatSession:
            raise HTTPException(status_code=404, detail="chatSession record not found")

        chatSession.session_type = "domain_specific_qa"
        db.add(chatSession)
        db.commit()

        db.query(ChatHistory).where(ChatHistory.session_id == chatSession.id).delete()
        db.commit()
        access_token = create_access_token(data={"sub": email})
        FE_URL = os.environ.get("FE_URL", "http://localhost:8080")
        print(FE_URL)
        evaluation: Evaluation = (
            db.query(Evaluation)
            .where(Evaluation.id == user_evaluation.evaluation_id)
            .first()
        )
        if send_viva_link:
            send_viva_mail_to_user(
                email,
                evaluation.track_name,
                f"{str(FE_URL)}/user-evaluation/{chatSession.id}?token={access_token}",
            )

        return {
            "msg": "Evaluation reopened",
            "user_evaluation_id": user_evaluation_id,
            "url": f"{str(FE_URL)}/user-evaluation/{chatSession.id}?token={access_token}",
        }

    else:
        db.execute(
            delete(EvaluationStep).where(
                EvaluationStep.userevaluation_id == user_evaluation_id,
                EvaluationStep.step_name == step_name,
            )
        )
        db.commit()
        return {
            "msg": "Evaluation reopened",
            "user_evaluation_id": user_evaluation_id,
            "evaluation_step": step_name,
        }


@router.get("/generate-questions/")
async def generate_question(
    requirement: str = Query(
        ..., description="What type of questions needs to be generated"
    ),
    number_of_questions: str = Query(
        ..., description="What type of questions needs to be generated"
    ),
):
    return await question_generator(requirement, number_of_questions)


@router.get("/")
def get_all(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise unauthorized_exception
    return get_all_evaluations(db)


@router.get("/{evaluation_id}/")
def get_by_id(
    evaluation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    if user.role != "admin":
        raise unauthorized_exception

    return get_single_evaluation_by_id(evaluation_id, db)


@router.get("/{evaluation_id}/{user_id}/")
def get_evaluation_status_of_an_user(
    evaluation_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    if user.role != "admin":
        raise unauthorized_exception

    return get_evaluation_status_of_user(evaluation_id, user_id, db)


@router.put("/{evaluation_id}/{user_id}/{step_name}/")
def update_an_evaluation_step(
    step_data: dict,
    evaluation_id: int,
    user_id: int,
    step_name: Literal[
        "commit_message_evaluation_report",
        "code_quality_report",
        "backend_test_execution_report",
        "frontend_test_execution_report",
        "milestone_wise_report",
    ],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "admin":
        raise unauthorized_exception
    return update_evaluation_step(
        evaluation_id=evaluation_id,
        user_id=user_id,
        step_name=step_name,
        step_data=step_data,
        db=db,
    )


@router.post("/domain_specific_qa/{chat_id}/")
def viva_qa(chat_id: int, qARequest: QARequest, db=Depends(get_db)):
    return qa(chat_id, qARequest.answer, db)


@router.post("/viva/voice/{chat_id}/")
async def viva_v2(
    chat_id: int,
    answer: UploadFile,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    return qa_v2(chat_id, answer, db, background_tasks)


@router.post("/viva/text/{chat_id}/")
def viva_text(
    chat_id: int,
    qARequest: QARequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    return qa_v2(chat_id, qARequest.answer, db, background_tasks)


# Websocket based viva
@router.get("/viva/questions/{chat_id}/{number_of_questions}/")
def viva_questions(chat_id: int, number_of_questions: int, db=Depends(get_db)):
    return qa_v3_get_questions(chat_id, number_of_questions, db)


@router.post("/viva/submit_question/text/{chat_id}/")
def submit_viva_question(
    chat_id: int,
    input: InputQuestion,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    return qa_v3_submit_question(chat_id, input, db)


@router.post("/viva/submit_answer/text/{chat_id}/")
async def submit_viva_answer_text(
    chat_id: int,
    viva_answer: QARequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    return await qa_v3_submit_answer(chat_id, viva_answer, db, background_tasks)


@router.post("/viva/submit_answer/voice/{chat_id}/")
async def submit_viva_answer_text(
    chat_id: int,
    viva_answer: UploadFile,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    return await qa_v3_submit_answer(chat_id, viva_answer, db, background_tasks)


manager = ConnectionManager()

@router.websocket("/ws/{chat_id}/")
async def websocket_endpoint(websocket: WebSocket, chat_id: int):
    await manager.connect(chat_id, websocket)
    print(f"Client {chat_id} connected")
    try:
        await get_question_from_queue(websocket, chat_id, manager)
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
    except Exception as e:
        print(f"Error in websocket for chat {chat_id}: {e}")
        manager.disconnect(chat_id, websocket)
        await websocket.close()


@router.websocket("/proxy/ws/")
async def websocket_proxy(
    websocket: WebSocket,
    target: str = Query(..., description="Target WebSocket URL (ws:// or wss://)"),
):
    await websocket.accept()
    client_closed = False
    target_closed = False

    async def forward_client_to_target(client_ws: WebSocket, target_ws):
        nonlocal client_closed
        try:
            while not client_closed and not target_closed:
                data = await client_ws.receive()
                if data["type"] == "websocket.receive":
                    if "text" in data:
                        await target_ws.send(data["text"])
                    elif "bytes" in data:
                        await target_ws.send(data["bytes"])
                elif data["type"] == "websocket.disconnect":
                    print("Client wanted to disconnect")
                    break
        except WebSocketDisconnect:
            print("Client disconnected")
        except Exception as e:
            print(f"Client to target error: {e}")
        finally:
            client_closed = True
            if not target_closed:
                await target_ws.close()

    async def forward_target_to_client(target_ws, client_ws: WebSocket):
        nonlocal target_closed
        try:
            async for message in target_ws:
                if client_closed:
                    print("Client is already closed")
                    break
                try:
                    if isinstance(message, str):
                        await client_ws.send_text(message)
                    elif isinstance(message, bytes):
                        await client_ws.send_bytes(message)
                except RuntimeError as e:
                    if "already closed" in str(e):
                        print("Client is already closed while sending data")
                        break
                    raise
        except websockets.exceptions.ConnectionClosedError as e:
            print(f"Target connection closed with error: {e}")
            if not client_closed:
                await client_ws.close(code=e.code, reason=e.reason)
        except Exception as e:
            print(f"Target to client error: {e}")
            if not client_closed:
                await client_ws.close()
        finally:
            target_closed = True

    try:
        if not target.startswith(("ws://", "wss://")):
            raise WebSocketException(code=1008, reason="Invalid WebSocket protocol")

        async with websockets.connect(target) as target_ws:
            client_to_target = asyncio.create_task(
                forward_client_to_target(websocket, target_ws)
            )
            target_to_client = asyncio.create_task(
                forward_target_to_client(target_ws, websocket)
            )

            done, pending = await asyncio.wait(
                [client_to_target, target_to_client],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    except (websockets.InvalidURI, ConnectionRefusedError) as e:
        if not client_closed:
            await websocket.close(code=1008, reason=f"Invalid target URL: {str(e)}")
    except Exception as e:
        print(f"Connection error: {str(e)}")
        if not client_closed:
            await websocket.close(code=1011, reason=str(e))
    finally:
        if not client_closed:
            await websocket.close()
            
@router.websocket("/gemini/ws/")
async def websocket_endpoint(websocket: WebSocket):
    handler = GeminiHandler(
        websocket=websocket,
    )
    await handler.run()


# S3 Upload of Screen Share


@router.post("/report/{evaluation_id}/{user_id}/")
def send_evaluation_report_to_user(
    evaluation_id: int, user_id: int, file: UploadFile, db: Session = Depends(get_db)
):

    email_id = db.query(User).where(User.id == user_id).first().username
    evaluation_name = (
        db.query(Evaluation).where(Evaluation.id == evaluation_id).first().track_name
    )

    mail_body = f"""
    <div class="email-container">
        <div class="email-body">
            <p>Hi,</p>
            <p>Please find attached your final result for <strong>{evaluation_name}</strong> track.</p>
            <p>Please note that this is an automated email and we kindly request that you refrain from responding to this address.</p>
            <p>Best regards,<br>HU Evaluator Team</p>
        </div>
    </div>
    """
    send_email(email_id, "HU Evaluation result", mail_body, [file])
    return {"message": "email sent successfully"}
