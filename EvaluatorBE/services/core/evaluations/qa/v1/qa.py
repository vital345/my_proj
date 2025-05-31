from sqlalchemy.orm import Session
from services.core.evaluations.qa.v1.domain_specific_qa import domain_specific_qa
from services.core.evaluations.qa.v1.project_specific_qa import project_specific_qa
from db.models.chat_session import ChatSession
from fastapi import UploadFile

def qa(chat_id:int,query:str | UploadFile,db:Session):
    
    chatSession:ChatSession = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first()
        
    if(chatSession.session_type == "project_specific_qa"):
        return project_specific_qa(chat_id,query,db)
    
    return domain_specific_qa(chat_id,query,db)
    