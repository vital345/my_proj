import asyncio
import json
from typing import Dict, List, Literal, Optional
from fastapi import BackgroundTasks
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from db.chat_history import get_chat_history
import random
from services.ai.agents.domain_specific_qa.schemas import *
from services.core.evaluations.qa.v3.queue import already_asked_questions
from services.core.evaluations.qa.v3.submit_answers.predefined_question_agent import delete_duplicate_question_from_chat_history_for_predefined_question



def predefined_questions_qa_agent(
    response_queues: Dict[int, List[Dict]],
    session_id: str,
    list_of_questions: List[str],
    domain_name: str,
    number_of_questions: int,
):
    chat_history = get_chat_history(session_id=session_id)
    if not chat_history.messages:
        already_asked_questions[session_id] = []
        while not response_queues[session_id].empty():
            response_queues[session_id].get()

    # delete_duplicate_question_from_chat_history_for_predefined_question(
    #     list_of_questions, chat_history
    # )

    random.shuffle(list_of_questions)
    questions_to_send = []
    if len(list_of_questions) >= number_of_questions:
        attempts = 0
        while len(questions_to_send) < number_of_questions and attempts < 10:
            question = random.choice(list_of_questions)
            if question not in already_asked_questions.get(session_id, []):
                questions_to_send.append(QuestionResponse(question=question, code_snippet=None))
                already_asked_questions[session_id].append(question)
            else:
                attempts += 1
                print("SEEMS ALREADY ASKED QUESTION IS FILLED DOMAIN SPECIFIC")
                print(already_asked_questions[session_id])
    print("Already asked questions in question_api domain")
    print(already_asked_questions.get(session_id))
    return questions_to_send
