from pkg_resources import Requirement
from db.base_class import Base
from sqlalchemy import Column,Integer,JSON,String,DateTime,Text,ForeignKey
from sqlalchemy.orm import relationship
from db.models.evaluation_step import EvaluationStep

class UserEvaluation(Base):
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    evaluation_id = Column(Integer, ForeignKey("evaluation.id"))
    deployed_url = Column(String,nullable=False)
    github_url = Column(String,nullable=False)
    # user = relationship("User",back_populates="user_evaluations")
    # evaluation = relationship("Evaluation",back_populates="user_evaluations")
    evaluation_steps = relationship("EvaluationStep",back_populates="user_evaluation")
    
    