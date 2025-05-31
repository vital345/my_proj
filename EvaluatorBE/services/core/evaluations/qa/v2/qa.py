from typing import Dict, List
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from services.core.evaluations.qa.v2.domain_specific_qa import domain_specific_qa
from services.core.evaluations.qa.v2.project_specific_qa import project_specific_qa
from db.models.chat_session import ChatSession
from collections import defaultdict


response_queues: Dict[int, List[Dict]] = defaultdict(list)

def qa(chat_id:int,query:str,db:Session, background_tasks: BackgroundTasks):
    
    chatSession:ChatSession = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first()
        
    if(chatSession.session_type == "project_specific_qa"):
        return project_specific_qa(chat_id,query,db, response_queues, background_tasks)
    
    return domain_specific_qa(chat_id,query,db, response_queues, background_tasks)
    