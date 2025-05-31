
from typing import Dict, List,Literal,Optional,Union
from fastapi import BackgroundTasks
from langchain_openai import ChatOpenAI
from pydantic import BaseModel,Field
from db.chat_history import get_chat_history
from langchain_core.messages.ai import AIMessage
from langchain_core.messages.human import HumanMessage
import json
from services.ai.agents.project_specific_qa_agent_v3.output_formatter import FinalReport, Question,output_formatter,Output
from services.ai.agents.project_specific_qa_agent_v3.supervisor import supervisor
import random


def delete_duplicate_question_from_chat_history(list_of_questions, chat_history):
    print("delete_duplicate_question_from_chat_history")
    print(list_of_questions)
    updated_list_of_questions = list_of_questions.copy()
    for message in chat_history.messages:
        try:
            if message.type == "ai":
                print("Removing this question if exist")
                print(json.loads(message.content).get("output", {}).get("question", ""))
                question_to_remove = json.loads(message.content).get("output", {}).get("question", "")
                updated_list_of_questions = [q for q in updated_list_of_questions if q.get("question_text") != question_to_remove]
                print("Found existing question in chat history")
        except Exception as e:
            print(e)
            print("This question is not in the list")
    print("Updated list of questions")
    print(updated_list_of_questions)
    return updated_list_of_questions
        
        


def main(session_id:str,list_of_questions:str,query:Optional[str], response_queues: Dict[int, List[Dict]], background_tasks: BackgroundTasks):
    chat_history = get_chat_history(session_id=session_id)
    
    if(len(chat_history.messages) > 0 and query == "" and chat_history.messages[-1].type == 'ai'):
        return Question(question = json.loads(chat_history.messages[-1].content)["output"]["question"], code_snippet=None)
    # list_of_questions = delete_duplicate_question_from_chat_history(list_of_questions, chat_history)
    print("Generating project specific question")
    # delete_duplicate_question_from_chat_history(list_of_questions, chat_history)
            
    if not response_queues.get(session_id) or len(response_queues.get(session_id)) < 3:
        background_tasks.add_task(call_agent, list_of_questions, query, chat_history, response_queues, session_id)
    
    random.shuffle(list_of_questions)
    if len(list_of_questions) == 0:
        print("No questions found")
        print("Generating final report")
        return call_agent(list_of_questions, query, chat_history, response_queues, session_id, True)
    ai_message = list_of_questions[0]
    
    print("$$$$$$$$$$$$$$$$$VIPIN2")
    print(response_queues.get(session_id))
    question = Question(question=ai_message.get("question_text"), code_snippet=ai_message.get("code_snippet"))
    formatted_output = Output(output=question)
    if response_queues.get(session_id):
        formatted_output_from_queue = response_queues.get(session_id).pop(0)
        if isinstance(formatted_output_from_queue.output, FinalReport) or isinstance(formatted_output_from_queue.output, Question) and not check_if_message_already_in_chat_history(formatted_output_from_queue.output, chat_history):
            formatted_output = formatted_output_from_queue
            print("Taking answer from queue")
        else:
            print("Duplicate question found in queue")
        print(formatted_output)
    else:
        print("Taking existing question")
        print(formatted_output)
    
    if(query != ""):
        chat_history.add_user_message(query)
    if(isinstance(formatted_output.output,Question)):
        chat_history.add_ai_message(json.dumps(formatted_output.model_dump()))
        
    
    return formatted_output.output

def check_if_message_already_in_chat_history(message, chat_history):
    print("Checking if message already in chat history")
    print(chat_history)
    print(">>>>>>>>>>>>>>")
    for chat_message in chat_history.messages:
        print(chat_message.content)
        if chat_message.type == "ai" and json.loads(chat_message.content).get("output", {}).get("question", "") == message.question:
            print("Message already in chat history")
            print(message.question)
            return True
        else:
            print("|||||||||||||||")
            print(chat_message.content)
            print(message.question)
            print("+++++++++++++++")
        
        
    return False

def call_agent(list_of_questions, query, chat_history, response_queues, session_id, generate_final_report=False):
    if generate_final_report:
        print("Generating final report")
        output = supervisor(list_of_questions,chat_history.messages + [("human",query), ("system", "GENERATE FINAL REPORT")])
        formatted_output:Output = output_formatter(output)
        print(formatted_output)
        return formatted_output.output
    print("^^^^^^^^^CHAT HISTORY")
    print(chat_history.messages)
    if chat_history.messages:
        print("__________________________---")
        print(chat_history.messages[-1] + "\n" +[("human",query)])
        print("^^^^^^^^^CHAT HISTORY END")
        output = supervisor(list_of_questions,chat_history.messages + [("human",query)])
        formatted_output:Output = output_formatter(output)
        print("***********CHAT HISTORY END OUPUT ", formatted_output)
        response_queues[session_id].append(formatted_output)
    else:
        print("No chat history")
   
        
        

   
    