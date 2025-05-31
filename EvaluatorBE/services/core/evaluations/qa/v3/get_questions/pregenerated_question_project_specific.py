import asyncio
from typing import Dict, List, Literal, Optional, Union
from fastapi import BackgroundTasks
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from db.chat_history import get_chat_history
from langchain_core.messages.ai import AIMessage
from langchain_core.messages.human import HumanMessage
import json
from services.ai.agents.project_specific_qa_agent_v3.output_formatter import (
    FinalReport,
    Question,
    output_formatter,
    Output,
)
from services.ai.agents.project_specific_qa_agent_v3.supervisor import supervisor
import random
from services.core.evaluations.qa.v3.queue import already_asked_questions
from services.core.evaluations.qa.v3.submit_answers.project_specific_question_agent import delete_duplicate_question_from_chat_history




def get_pregenerated_questions(
    session_id: str,
    list_of_questions: str,
    response_queues: Dict[int, List[Dict]],
    number_of_questions: int,
):
    chat_history = get_chat_history(session_id=session_id)
    if not chat_history.messages:
        already_asked_questions[session_id] = []
        while not response_queues[session_id].empty():
            response_queues[session_id].get()


    # list_of_questions = delete_duplicate_question_from_chat_history(
    #     list_of_questions, chat_history
    # )
    # print("removing already asked questions for get_question api")
    list_of_questions = [
        i
        for i in list_of_questions
        if i.get("question_text") not in already_asked_questions.get(session_id, [])
    ]
    random.shuffle(list_of_questions)
    questions_to_send = []    
    if len(list_of_questions) >= number_of_questions:
        attempts = 0
        while len(questions_to_send) < number_of_questions and attempts < 10:
            question = random.choice(list_of_questions)
            if question.get("question_text") not in already_asked_questions.get(session_id, []):
                questions_to_send.append(Question(question=question.get("question_text"), code_snippet=question.get("code_snippet")))
                already_asked_questions[session_id].append(question.get("question_text"))
            else:
                attempts += 1
                print("SEEMS ALREADY ASKED QUESTION IS FILLED PROJECT SPECIFIC")
                print(already_asked_questions[session_id])
                
    print("Already asked questions in question_api project")
    print(already_asked_questions.get(session_id))
    return questions_to_send
