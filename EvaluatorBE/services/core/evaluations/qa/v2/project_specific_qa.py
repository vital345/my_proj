from typing import Dict, List
from sqlalchemy.orm import Session
from db.models.evaluation_step import EvaluationStep
from db.models.user_evaluation import UserEvaluation
from db.models.chat_session import ChatSession
from db.models.chat_history import ChatHistory
from services.ai.agents.project_specific_qa_agent_v3.main import main as project_specific_qa_agent, Question
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

def project_specific_qa(chat_id: int, query: str | UploadFile, db: Session, response_queues: Dict[int, List[Dict]], background_tasks: BackgroundTasks):

    user_evaluation_id: int = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first().userevaluation_id

    userEvaluation: UserEvaluation = db.query(UserEvaluation).where(
        UserEvaluation.id == user_evaluation_id
    ).first()

    user: User = db.query(User).where(
        User.id == userEvaluation.user_id).first()

    chatSession: ChatSession = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first()

    if (
        db.query(
            EvaluationStep).where(
            EvaluationStep.step_name == 'project_specific_qa'
        ).where(
            EvaluationStep.userevaluation_id == userEvaluation.id
        ).first() != None
    ):

        return {
            "question": None,
            "is_complete": True,
            "viva_type": "Project specific viva",
            "errors": [
                "evaluation already completed"
            ]
        }

    # cloned_repo_path = clone_github_repo(
    #     userEvaluation.github_url, user.username)
    # temporary_file = tempfile.NamedTemporaryFile(dir="./.tmp")
    # subprocess.run(
    #     f'repomix "{cloned_repo_path}" -o "{temporary_file.name}"', shell=True)
    # repo_string = temporary_file.read()
    # temporary_file.close()
    if (not isinstance(query, str)):
        query = convert_speech_to_text(query)

    milestone_report = db.query(EvaluationStep).where(EvaluationStep.step_name == 'milestone_wise_report').where(
        EvaluationStep.userevaluation_id == userEvaluation.id).first()

    questions = []

    for milestone in milestone_report.step_report['milestone_reports']:
        questions = questions + milestone.get('questions', [])
    print("chat_id: ", chat_id)
    # print("Questions: ", questions)
    print("CURRENT query: ", query)
    result = project_specific_qa_agent(chat_id, questions, query, response_queues, background_tasks)
    print("result: ", result)
    if (isinstance(result, Question)):

        chat_history = get_chat_history(session_id=chat_id).messages
        processed_chat_history = []
        for message in chat_history:
            if message.type != 'ai':
                processed_chat_history.append(message)
            else:
                message.content = json.loads(message.content)[
                    'output']['question']
                processed_chat_history.append(message)

        # Generate audio for the question
        try:
            audio_content = convert_text_to_audio(result.question)
            encoded_audio = base64.b64encode(audio_content).decode('utf-8')
        except Exception as e:
            return {
                "error": str(e),
                "question": result.question,
                "code_snippet": result.code_snippet,
                "is_complete": False,
                "previous_answer": query,
                "chat_history": processed_chat_history,
                "errors": [],
                "viva_type": "Project specific viva"
            }
        return {
            "audio": encoded_audio,
            "question": result.question,
            "code_snippet": result.code_snippet,
            "is_complete": False,
            "previous_answer": query,
            "chat_history": processed_chat_history,  # Convert to JSON string
            "errors": [],  # Convert to JSON string
            "viva_type": "Project specific viva"
        }

    else:
        chat_history = get_chat_history(chat_id).messages
        chat_history = [message.model_dump() for message in chat_history]
        try:
            del response_queues[chat_id]
        except:
            pass
        print("Step: Project specific QA")
        print("Score: ", result.score)
        print("Explanation: ", result.explanation)
        print("questions: ", chat_history)
        db.add(
            EvaluationStep(
                userevaluation_id=userEvaluation.id,
                step_name='project_specific_qa',
                step_report={
                    "score": result.score,
                    "explanation": result.explanation,
                    "questions": chat_history
                }
            )
        )
        db.commit()

        db.query(ChatHistory).where(
            ChatHistory.session_id == chatSession.id).delete()

        db.commit()

        return {
            "question": None,
            "is_complete": True,
            "errors": [],
            "viva_type": "Project specific viva",
        }
