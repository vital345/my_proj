from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.base_class import Base
from db.models.user_evaluation import UserEvaluation

class User(Base):
    id = Column(Integer, primary_key=True)
    username = Column(String,nullable=False,unique=True)
    password = Column(String,nullable=False)
    role = Column(String,nullable=False)
    full_name = Column(String,nullable=True, default="Default User")
    # user_evaluations = relationship("UserEvaluation",back_populates="user")
    evaluations = relationship("Evaluation",secondary="userevaluation",back_populates="users")