from sqlalchemy import Column, Integer, ForeignKey,String
from sqlalchemy.orm import relationship
from db.base_class import Base
from db.models.chat_history import ChatHistory



class ChatSession(Base):
    id = Column(Integer, primary_key=True)
    chat_history = relationship("ChatHistory", back_populates="chat_session")
    userevaluation_id = Column(Integer, ForeignKey("userevaluation.id"),nullable=False)
    session_type = Column(String,nullable=False)
    
    
  