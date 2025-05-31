import json
from typing import Dict, List
from fastapi import BackgroundTasks, UploadFile
from sqlalchemy.orm import Session
from db.chat_history import get_chat_history
from db.models.chat_history import ChatHistory
from services.core.evaluations.qa.v3.get_questions.domain_specific_qa import (
    domain_specific_qa,
)
from services.core.evaluations.qa.v3.get_questions.project_specific_qa import (
    project_specific_qa,
)
from db.models.chat_session import ChatSession
from services.core.evaluations.qa.v3.queue import (
    response_queues,
    already_asked_questions,
)
from schemas.qa import InputQuestion, QARequest, Question
from services.core.evaluations.qa.v3.submit_answers.submit_answer import (
    submit_answer_domain_specific,
    submit_answer_project_specific,
)


def qa_v3_get_questions(chat_id: int, number_of_questions: int, db: Session):

    chatSession: ChatSession = (
        db.query(ChatSession).where(ChatSession.id == chat_id).first()
    )

    if chatSession.session_type == "project_specific_qa":
        return project_specific_qa(chat_id, number_of_questions, db, response_queues)

    return domain_specific_qa(chat_id, number_of_questions, db, response_queues)


def qa_v3_submit_question(chat_id, input: InputQuestion, db: Session):

    chatSession: ChatSession = (
        db.query(ChatSession).where(ChatSession.id == chat_id).first()
    )
    if input.clean_session:
        chatSession.session_type = "project_specific_qa"
        db.add(chatSession)
        # Two case either you send the domain specific and keep trainee buzy with that and meanwhile you can generate project specific voice
        # Else trainee have to wait for project specific voice to be generated
        db.query(ChatHistory).where(ChatHistory.session_id == chatSession.id).delete()
        db.commit()

    chat_history = get_chat_history(session_id=chat_id)
    chat_history.add_ai_message(json.dumps(input.question.model_dump()))
    print(chat_history)
    return {
        "chat_history": [message.model_dump() for message in chat_history.messages],
        "viva_type": chatSession.session_type,
    }


async def qa_v3_submit_answer(
    chat_id: int,
    answer: QARequest | UploadFile,
    db: Session,
    background_tasks: BackgroundTasks,
):

    chatSession: ChatSession = (
        db.query(ChatSession).where(ChatSession.id == chat_id).first()
    )
    if chatSession.session_type == "project_specific_qa":
        return await submit_answer_project_specific(
            chat_id,
            answer,
            db,
            response_queues,
            background_tasks,
            already_asked_questions,
        )

    return submit_answer_domain_specific(
        chat_id, answer, db, response_queues, background_tasks, already_asked_questions
    )
