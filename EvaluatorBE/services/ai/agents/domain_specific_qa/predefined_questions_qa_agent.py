import json
from typing import Dict, List,Literal,Optional
from fastapi import BackgroundTasks
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
from db.chat_history import get_chat_history
import random
from services.ai.agents.domain_specific_qa.schemas import *


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
 - Ask a maximum of 5 questions.
 - Do not provide answers to the questions. Your role is to ask, not to teach.
 - If the user is unable to answer, simply move on to the next question.

---

Domain Name: {domain_name}
Question List: {question_list}
"""


def delete_duplicate_question_from_chat_history_for_predefined_question(list_of_questions, chat_history):
    for message in chat_history.messages:
        try:
            if message.type == "ai":
                print("Removing this question if exist")
                list_of_questions.remove(message.content)
                print("Found existing question in chat history")
                print(message.content)
        except:
            print("This question is not in the list")


def predefined_questions_qa_agent(
    response_queues: Dict[int, List[Dict]], background_tasks: BackgroundTasks,
    session_id:str,
    list_of_questions:List[str],
    domain_name:str,
    query:Optional[str] = "",
):
    random.shuffle(list_of_questions)
    chat_history = get_chat_history(session_id=session_id)
    if(len(chat_history.messages) > 0  and query == "" and chat_history.messages[-1].type == 'ai'):
        print("#######VIPIN2")
        return Question(question = chat_history.messages[-1].content)
    inp = ""
    
    # delete_duplicate_question_from_chat_history_for_predefined_question(list_of_questions, chat_history)

    question = Question(question=list_of_questions[0])
    output = Output(output=question)
    print(response_queues, "#########", chat_history.messages)
    if response_queues.get(session_id):
        output_from_queue = response_queues.get(session_id).pop(0)
        if isinstance(output_from_queue.output, FinalReport) or (isinstance(output_from_queue.output, Question) and not check_if_message_already_in_chat_history_for_predefined_question(output_from_queue.output, chat_history)):
            output = output_from_queue
        else:
            print("Duplicate question found in queue", question.question)
    if not response_queues.get(session_id) or len(response_queues.get(session_id)) < 2:
        background_tasks.add_task(call_agent, list_of_questions, domain_name, query, chat_history, response_queues, session_id)
    
    if(query != ""):
        chat_history.add_user_message(query)
    if(isinstance(output.output,Question)):
        chat_history.add_ai_message(output.output.question)

    return output.output

def call_agent(list_of_questions, domain_name, query, chat_history, response_queues, session_id):
    questions_str = " \n".join([f"{index + 1}. {question}" for index,question in enumerate(list_of_questions)])
    _llm = llm.with_structured_output(Output)
    _system_prompt = str.format(
        system_prompt,
        domain_name = domain_name,
        question_list = questions_str
        )
    
    n = 0
    
    while True:
        print("generating predefined question")
        try: 
            output:Output =  _llm.invoke([
            ("system",_system_prompt)] + chat_history.messages + [("human",query)])
            print("Successfully generated predefined question")
            break
        except:
            print("Error in generating question retrying !!!")
            n += 1
            if(n < 3): continue
            else: raise Exception("Unable to Generate llm output in desired format")
                
    response_queues[session_id].append(output)
    
def check_if_message_already_in_chat_history_for_predefined_question(message, chat_history):
    print("check_if_message_already_in_chat_history_for_predefined_question")
    print(chat_history)
    print(">>>>>>>>>>>>>>")
    for chat_message in chat_history.messages:
        print(chat_message.content)
        if chat_message.type == "ai" and chat_message.content == message.question:
            print("Message already in chat history")
            print(message.question)
            return True
        else:
            print("|||||||||||||||")
            print(chat_message.content)
            print(message.question)
            print("+++++++++++++++")
    return False
    
    
        
if __name__ == '__main__':
    questions = [
  "What is FastAPI and what are its main advantages?",
  "How does FastAPI compare to other Python web frameworks like Flask and Django?",
  "What is ASGI and how does it relate to FastAPI?",
  "Explain the role of Pydantic in FastAPI.",
  "What are the key features of FastAPI?",
  "How does FastAPI handle asynchronous programming?",
  "What are path parameters and how are they used in FastAPI?",
  "Describe how query parameters work in FastAPI.",
  "What is dependency injection and how is it implemented in FastAPI?",
  "How does FastAPI handle request validation?",
  "Explain how FastAPI supports OpenAPI and automatic API documentation.",
  "What is the purpose of middleware in FastAPI?",
  "How does FastAPI handle authentication and authorization?",
  "What are background tasks in FastAPI and how are they used?",
  "How can you test FastAPI applications effectively?"
]
    
    int = ""
    while True:
        output = predefined_questions_qa_agent(1,"")
        print(output)
        inp = input("human: ")
        if(inp == "exit") : break
        
        

   
    