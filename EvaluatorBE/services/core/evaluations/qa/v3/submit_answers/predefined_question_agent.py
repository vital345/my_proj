import asyncio
import json
import os
from typing import Dict, List, Literal, Optional
from dotenv import load_dotenv
from fastapi import BackgroundTasks
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from db.chat_history import get_chat_history
import random
from services.ai.agents.domain_specific_qa.schemas import *
load_dotenv()


# memory = MemorySaver()

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)


system_prompt = """
You are a knowledge evaluation agent, responsible for assessing the user's 
expertise in a specific domain. Your task is to ask the user a series of questions 
from a predefined list to gauge their understanding and assign a score based on 
their responses. 
Please follow these guidelines:
1. Question Selection: You will be provided with a domain name and a set of 
questions. Randomly select questions from the list to ask the user.

2. Evaluation Criteria:
 - Score each response based on correctness, completeness, and depth of explanation.
 - Assess both factual accuracy and the user's ability to clearly explain concepts.
 - Adjust scores if the user provides incomplete or unclear answers.
 
3. User Engagement:
 - If the user seems uncertain, offer follow-up questions to encourage clarification.
 - Keep the tone friendly, while remaining focused on evaluating the user's knowledge.

4. Scoring:
After the questions, provide a score from 0 to 10 based on the overall quality of responses:
 - 0-3: Limited knowledge with significant gaps.
 - 4-6: Basic to moderate knowledge, but with noticeable gaps.
 - 7-9: Strong knowledge, with minor areas for improvement.
 - 10: Expert-level knowledge and a comprehensive understanding.
 
5. Final Output:
Provide a brief summary explaining the score and highlight the user's strengths 
and areas for improvement.

6. Important Notes:
 - Do not provide answers to the questions. Your role is to ask, not to teach.
 - If the user is unable to answer, simply move on to the next question.
 - If system ask to GENERATE FINAL REPORT then generate the Final Ouput
 - Do not ask already asked questions

---

Domain Name: {domain_name}
Question List: {question_list}
"""


def delete_duplicate_question_from_chat_history_for_predefined_question(
    list_of_questions, chat_history
):
    for message in chat_history.messages:
        try:
            if message.type == "ai":
                print("\n"*5)
                print("88888888888888888888888888")
                print("Removing this question if exist ALARM 2")
                print(message.content)
                list_of_questions.remove(json.loads(message.content).get("question"))
                print("88888888888888888888888888")
                print("\n"*5)
                print("Found existing question in chat history")
                print(message.content)
        except Exception as e:
            print(e)
            print("This question is not in the list")


def domain_specific_agent(
    response_queues: Dict[int, List[Dict]],
    background_tasks: BackgroundTasks,
    session_id: str,
    list_of_questions: List[str],
    domain_name: str,
    already_asked_questions,
    query: Optional[str] = "",
):

    chat_history = get_chat_history(session_id)
    chat_history.add_user_message(query)

    # delete_duplicate_question_from_chat_history_for_predefined_question(
    #     list_of_questions, chat_history
    # )
    list_of_questions = list(
        set(list_of_questions) - set(already_asked_questions.get(session_id, []))
    )
    print("\n"*5)
    print("ALREADY AKSED QUESTION")
    print(already_asked_questions.get(session_id, []))
    print("NEW QUESTION LIST DOMAIN")
    print(list_of_questions)
    print("\n"*5)

    background_tasks.add_task(
        call_agent,
        list_of_questions,
        domain_name,
        query,
        chat_history,
        response_queues,
        session_id,
    )
    print("Ageng in background for domain specific")

    return chat_history


def call_agent(
    list_of_questions,
    domain_name,
    query,
    chat_history,
    response_queues: Dict[int, asyncio.Queue],
    session_id,
):
    print("Agent called domain specific")
    questions_str = " \n".join(
        [f"{index + 1}. {question}" for index, question in enumerate(list_of_questions)]
    )
    _llm = llm.with_structured_output(Output)
    _system_prompt = str.format(
        system_prompt, domain_name=domain_name, question_list=questions_str
    )

    n = 0
    messages = chat_history.messages
    domain_specific_question_count = os.environ.get("DOMAIN_SPECIFIC_QUESTION_COUNT")
    print("Value of DOMAIN_SPECIFIC_QUESTION_COUNT: ", domain_specific_question_count)
    if messages and len(messages) >= int(domain_specific_question_count) * 2:
        messages += [("system", "GENERATE FINAL REPORT")]
        print("Forcefully generating final report for domain specific")
        

    while True:
        print("generating predefined question")
        try:
            output: Output = _llm.invoke(
                [("system", _system_prompt)]
                + messages
            )
            print("Successfully generated predefined question")
            break
        except:
            print("Error in generating question retrying !!!")
            n += 1
            if n < 3:
                continue
            else:
                raise Exception("Unable to Generate llm output in desired format")

    print(
        "Queue size predefined question before adding: ",
        response_queues[session_id].qsize(),
    )
    response_queues[session_id].put_nowait(output.output)
    print(
        "Queue size predefined question after adding: ",
        response_queues[session_id].qsize(),
    )
