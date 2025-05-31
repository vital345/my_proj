from sqlalchemy import Column, Integer, ForeignKey,DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base_class import Base

class ChatHistory(Base):
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chatsession.id"))
    chat_session = relationship("ChatSession",back_populates="chat_history")
    message = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
  