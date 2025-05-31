from db.models.chat_session import ChatSession
from db.models.chat_history import ChatHistory
from db.models.user_evaluation import UserEvaluation
from schemas.chat import CreateChat
from sqlalchemy.orm import Session

def create_chat_session(chat:CreateChat,db:Session):
    userEvaluation:UserEvaluation = db.query(
        UserEvaluation).where(
            UserEvaluation.user_id == chat.user_id
            ).where(
                UserEvaluation.evaluation_id == chat.evaluation_id).first()
            
    session = ChatSession(
        userevaluation_id = userEvaluation.id,
        session_type = chat.session_type
        )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id":session.id
    }