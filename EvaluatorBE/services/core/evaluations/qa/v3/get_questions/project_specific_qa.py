from typing import Dict, List
from sqlalchemy.orm import Session
from db.models.evaluation_step import EvaluationStep
from db.models.user_evaluation import UserEvaluation
from db.models.chat_session import ChatSession
from db.models.chat_history import ChatHistory
import subprocess
import tempfile
from services.core.clone_repository import clone_github_repo
from db.models.user import User
from db.chat_history import get_chat_history
from services.ai.speech_processing.speech_to_text import convert_speech_to_text
from fastapi import BackgroundTasks, UploadFile, Response
import json
from db.models.evaluation_step import EvaluationStep
from services.ai.agents.eleven_labs.text_to_audio import convert_text_to_audio
from fastapi.responses import JSONResponse
import base64
from services.core.evaluations.qa.v3.get_questions.pregenerated_question_project_specific import (
    get_pregenerated_questions,
)


def project_specific_qa(
    chat_id: int,
    number_of_questions: int,
    db: Session,
    response_queues: Dict[int, List[Dict]],
):

    user_evaluation_id: int = (
        db.query(ChatSession).where(ChatSession.id == chat_id).first().userevaluation_id
    )

    userEvaluation: UserEvaluation = (
        db.query(UserEvaluation).where(UserEvaluation.id == user_evaluation_id).first()
    )


    if (
        db.query(EvaluationStep)
        .where(EvaluationStep.step_name == "project_specific_qa")
        .where(EvaluationStep.userevaluation_id == userEvaluation.id)
        .first()
        != None
    ):

        return {
            "question": None,
            "is_complete": True,
            "viva_type": "project_specific_qa",
            "errors": ["evaluation already completed"],
        }

    milestone_report = (
        db.query(EvaluationStep)
        .where(EvaluationStep.step_name == "milestone_wise_report")
        .where(EvaluationStep.userevaluation_id == userEvaluation.id)
        .first()
    )

    questions = []

    for milestone in milestone_report.step_report["milestone_reports"]:
        questions = questions + milestone.get("questions", [])

    if not questions:
        return {
            "question": None,
            "is_complete": True,
            "errors": ["No questions available for this evaluation"],
            "viva_type": "project_specific_qa",
        }

    list_of_questions = get_pregenerated_questions(
        session_id=chat_id,
        list_of_questions=questions,
        number_of_questions=number_of_questions,
        response_queues=response_queues,
    )

    return {
        "question": list_of_questions,
        "is_complete": False,
        "errors": [],
        "viva_type": "project_specific_qa",
    }
