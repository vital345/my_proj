import asyncio
import os
from typing import Dict, List, Literal, Optional, Union
from dotenv import load_dotenv
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
from langchain_community.chat_message_histories import PostgresChatMessageHistory

load_dotenv()


def delete_duplicate_question_from_chat_history(
    list_of_questions, chat_history
):
    print("delete_duplicate_question_from_chat_history")
    print(list_of_questions)
    updated_list_of_questions = list_of_questions.copy()
    for message in chat_history.messages:
        try:
            if message.type == "ai":
                
                print("\n"*5)
                print("88888888888888888888888888")
                print("Removing this question if exist ALARM 1")
                print(message.content)
                print("88888888888888888888888888")
                print("\n"*5)
                question_to_remove = (
                    json.loads(message.content).get("question")
                )
                updated_list_of_questions = [
                    q
                    for q in updated_list_of_questions
                    if q.get("question_text") != question_to_remove
                ]
                print("Found existing question in chat history")
        except Exception as e:
            print(e)
            print("This question is not in the list")
    print("Updated list of questions")
    print(updated_list_of_questions)
    return updated_list_of_questions


def project_specific_agent(
    session_id: str,
    list_of_questions: str,
    query: Optional[str],
    response_queues: Dict[int, List[Dict]],
    background_tasks: BackgroundTasks,
    chat_history: PostgresChatMessageHistory,
    already_asked_questions,
):

    chat_history.add_user_message(query)
    # list_of_questions = delete_duplicate_question_from_chat_history(
    #     list_of_questions, chat_history
    # )
    # print("removing already asked questions")
    list_of_questions = [
        i
        for i in list_of_questions
        if i.get("question_text") not in already_asked_questions.get(session_id, [])
    ]
    
    print("\n"*5)
    print("ALREADY AKSED QUESTION")
    print(already_asked_questions.get(session_id, []))
    print("NEW QUESTION LIST DOMAIN")
    print(list_of_questions)
    print("\n"*5)
    
    if len(list_of_questions) == 0:
        print("No questions found")
        print("Generating final report")
        return call_agent(
            list_of_questions, query, chat_history, response_queues, session_id, True
        )

    background_tasks.add_task(
        call_agent, list_of_questions, query, chat_history, response_queues, session_id
    )
    print("Project specific Agent in Backgroud")


def check_if_message_already_in_chat_history(message, chat_history):
    print("Checking if message already in chat history")
    print(chat_history.messages)
    print(">>>>>>>>>>>>>>")
    for chat_message in chat_history.messages:
        print(chat_message.content)
        if (
            chat_message.type == "ai"
            and json.loads(chat_message.content).get("output", {}).get("question", "")
            == message.question
        ):
            print("Message already in chat history")
            print(message.question)
            return True
        else:
            print("|||||||||||||||")
            print(chat_message.content)
            print(message.question)
            print("+++++++++++++++")

    return False


def call_agent(
    list_of_questions,
    query,
    chat_history,
    response_queues: Dict[int, asyncio.Queue],
    session_id,
    generate_final_report=False,
):
    print("Called agent for project specific")
    if generate_final_report:
        print("Generating final report")
        output = supervisor(
            list_of_questions,
            chat_history.messages
            + [("system", "GENERATE FINAL REPORT")],
        )
        formatted_output: Output = output_formatter(output)
        print(formatted_output)
        return formatted_output.output
    print("^^^^^^^^^CHAT HISTORY")
    messages = chat_history.messages
    print(messages)
    project_specific_question_count = os.environ.get("PROJECT_SPECIFIC_QUESTION_COUNT")
    print("Value of PROJECT_SPECIFIC_QUESTION_COUNT: ", project_specific_question_count)
    if messages and len(messages) >= int(project_specific_question_count) * 2:
        messages += [("system", "GENERATE FINAL REPORT")]
        print("Forcefully generating final report for project specific")
        
    if messages:
        print("__________________________---")
        print(messages[-1])
        print("^^^^^^^^^CHAT HISTORY END")
        output = supervisor(
            list_of_questions, messages
        )
        formatted_output: Output = output_formatter(output)
        print("***********CHAT HISTORY END OUPUT ", formatted_output)
        print("Queue size project question before adding: ", response_queues[session_id].qsize())
        response_queues[session_id].put_nowait(formatted_output.output)
        print("Queue size project question after adding: ", response_queues[session_id].qsize())
    else:
        print("No chat history")
