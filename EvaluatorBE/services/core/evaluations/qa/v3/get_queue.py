import json
import traceback
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from sqlalchemy.orm import Session
from db.chat_history import get_chat_history
from db.models.chat_history import ChatHistory
from db.models.chat_session import ChatSession
from db.models.evaluation_step import EvaluationStep
from db.models.user_evaluation import UserEvaluation
from services.core.evaluations.qa.v3.queue import (
    response_queues,
    already_asked_questions,
)
from services.ai.agents.domain_specific_qa.schemas import (
    FinalReport as DomainSpecificFinalReport,
    Question as DomainSpecificQuestion,
)
from services.ai.agents.project_specific_qa_agent_v3.output_formatter import (
    FinalReport as ProjectSpecificFinalReport,
    Question as ProjectSpecificQuestion,
)
from db.session import engine
from services.core.evaluations.qa.v3.submit_answers.score_agent import (
    OutputScoreAgent,
    score_giving_agent_for_final_report,
)


class ConnectionManager:
    def __init__(self):
        # maps chat_id to list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, chat_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(chat_id, []).append(websocket)
        print(f"Client {websocket.client} connected on chat {chat_id}")

    def disconnect(self, chat_id: int, websocket: WebSocket):
        conns = self.active_connections.get(chat_id, [])
        if websocket in conns:
            conns.remove(websocket)
            print(f"Client {websocket.client} disconnected from chat {chat_id}")
            # if no one left on this chat, remove the key
            if not conns:
                self.active_connections.pop(chat_id)

    async def broadcast(self, chat_id: int, message: str):
        conns = self.active_connections.get(chat_id, [])
        for connection in conns:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                # if a client drops unexpectedly, clean up
                self.disconnect(chat_id, connection)


async def get_question_from_queue(
    websocket: WebSocket, chat_id: int, manager: ConnectionManager
):
    while True:
        # print(response_queues.get(chat_id).qsize())
        if websocket.client_state != WebSocketState.CONNECTED:
            raise WebSocketDisconnect(reason="Client was connected but now its not")
        object_from_queue = await response_queues[chat_id].get()
        print("Object from queue: ", object_from_queue)
        print("TYPE", type(object_from_queue))
        print("\n" * 5)
        print("2222222222222222222222222")
        print("Already answered question ALARM 3")
        print(already_asked_questions.get(chat_id))
        print("2222222222222222222222222")
        print("\n" * 5)
        if isinstance(object_from_queue, DomainSpecificFinalReport):
            print("Domain Final report sending to FE")

            await manager.broadcast(
                chat_id,
                {
                    "question": None,
                    "step": "domain_specific_qa",
                    "is_completed": True,
                    "output": object_from_queue.model_dump_json(),
                },
            )
            await process_domain_specific_final_report(chat_id, object_from_queue)
        elif isinstance(object_from_queue, DomainSpecificQuestion):
            print("Already asked domain questions: ", already_asked_questions[chat_id])
            print("Sending domain specific question to FE")
            if object_from_queue.question not in already_asked_questions[chat_id]:
                already_asked_questions[chat_id].append(object_from_queue.question)
                await manager.broadcast(
                    chat_id,
                    {
                        "question": object_from_queue.model_dump_json(),
                        "step": "domain_specific_qa",
                        "is_completed": False,
                        "output": None,
                    },
                )
            else:
                print("Discarding this domain specific question coming from queue")
                print(object_from_queue)
        elif isinstance(object_from_queue, ProjectSpecificFinalReport):
            print("Project Final report sending to FE")

            await manager.broadcast(
                chat_id,
                {
                    "question": None,
                    "step": "project_specific_qa",
                    "is_completed": True,
                    "output": object_from_queue.model_dump_json(),
                },
            )
            await process_project_specific_final_report(chat_id, object_from_queue)
        elif isinstance(object_from_queue, ProjectSpecificQuestion):
            print("Already asked project questions: ", already_asked_questions[chat_id])
            print("Sending project specific question to FE")
            if object_from_queue.question not in already_asked_questions[chat_id]:
                already_asked_questions[chat_id].append(object_from_queue.question)
                await manager.broadcast(
                    chat_id,
                    {
                        "question": object_from_queue.model_dump_json(),
                        "step": "project_specific_qa",
                        "is_completed": False,
                        "output": None,
                    },
                )
            else:
                print("Discarding this project specific question coming from queue")
                print(object_from_queue)
        else:
            print("Type of queue object", type(object_from_queue))
            print("Queue is not empty but still coming to else block")


async def process_project_specific_final_report(chat_id, object_from_queue):
    with Session(engine) as db:
        user_evaluation_id: int = (
            db.query(ChatSession)
            .where(ChatSession.id == chat_id)
            .first()
            .userevaluation_id
        )

        userEvaluation: UserEvaluation = (
            db.query(UserEvaluation)
            .where(UserEvaluation.id == user_evaluation_id)
            .first()
        )

        chatSession: ChatSession = (
            db.query(ChatSession).where(ChatSession.id == chat_id).first()
        )
        chat_history = get_chat_history(chat_id).messages
        chat_history = [message.model_dump() for message in chat_history]
        output = await get_score_for_individual_answer(chat_history)

        print("Step: Project specific QA")
        print("Score: ", object_from_queue.score)
        print("Explanation: ", object_from_queue.explanation)
        print("New Object project: ", output)
        print("questions: ", chat_history)
        db.add(
            EvaluationStep(
                userevaluation_id=userEvaluation.id,
                step_name="project_specific_qa",
                step_report={
                    "score": output.overall_score,  # object_from_queue.score
                    "explanation": output.overall_feedback,  # object_from_queue.explanation
                    "questions": chat_history,
                },
            )
        )
        db.commit()

        db.query(ChatHistory).where(ChatHistory.session_id == chatSession.id).delete()

        db.commit()
    try:
        while not response_queues[chat_id].empty():
            await response_queues[chat_id]
        already_asked_questions[chat_id] = []
    except Exception as e:
        print(e)
        print("Erroring while deleting queue")


async def get_score_for_individual_answer(chat_history):
    try:
        output: OutputScoreAgent = await score_giving_agent_for_final_report(
            questions=chat_history
        )
        for message in chat_history:
            if message["type"] == "ai":
                message_content = json.loads(message["content"])
                question = message_content["question"]
                changed = False
                for agent_output in output.output:
                    if agent_output.question.startswith(question):
                        message["ai_score"] = agent_output.score
                        message["ai_explanation"] = agent_output.explanation
                        changed = True
                        break
                if not changed:
                    print("Question not found in output")
                    print(question)
                    print(output.output)
                    message["ai_score"] = None
                    message["ai_explanation"] = "No explanation avaliable"
    except Exception as e:
        traceback.print_exc()
    return output


async def process_domain_specific_final_report(chat_id, object_from_queue):
    print("Step: Domain specific QA")
    print("Score: ", object_from_queue.score)
    print("Explanation: ", object_from_queue.explanation)
    with Session(engine) as db:
        user_evaluation_id: int = (
            db.query(ChatSession)
            .where(ChatSession.id == chat_id)
            .first()
            .userevaluation_id
        )

        userEvaluation: UserEvaluation = (
            db.query(UserEvaluation)
            .where(UserEvaluation.id == user_evaluation_id)
            .first()
        )

        chatSession: ChatSession = (
            db.query(ChatSession).where(ChatSession.id == chat_id).first()
        )

        chat_history = get_chat_history(chat_id).messages
        chat_history = [message.model_dump() for message in chat_history]
        output = await get_score_for_individual_answer(chat_history)
        print("New Object domain: ", output)
        db.add(
            EvaluationStep(
                userevaluation_id=userEvaluation.id,
                step_name="domain_specific_qa",
                step_report={
                    "score": output.overall_score,  # object_from_queue.score
                    "explanation": output.overall_feedback,  # object_from_queue.explanation
                    "questions": chat_history,
                },
            )
        )
        db.commit()

        chatSession.session_type = "project_specific_qa"
        db.add(chatSession)
        db.commit()
        db.refresh(chatSession)

        db.query(ChatHistory).where(ChatHistory.session_id == chatSession.id).delete()
        db.commit()
    try:
        while not response_queues[chat_id].empty():
            await response_queues[chat_id].get()
    except Exception as e:
        print(e)
        print("Erroring while deleting queue")
