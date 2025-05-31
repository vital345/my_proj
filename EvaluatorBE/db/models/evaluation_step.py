from pkg_resources import Requirement
from db.base_class import Base
from sqlalchemy import Column,Integer,JSON,String,DateTime,Text,ForeignKey,Enum,UniqueConstraint
from sqlalchemy.orm import relationship


class EvaluationStep(Base):
    
    __table_args__ = (
        # this can be db.PrimaryKeyConstraint if you want it to be a primary key
        UniqueConstraint('userevaluation_id', 'step_name'),
      )
     
    
    id = Column(Integer, primary_key=True, index=True)
    userevaluation_id = Column(Integer, ForeignKey("userevaluation.id"))
    step_name = Column(String,nullable=False)
    step_report = Column(JSON,nullable=False)
    user_evaluation = relationship("UserEvaluation",back_populates="evaluation_steps")
    