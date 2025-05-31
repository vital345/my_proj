from pkg_resources import Requirement
from db.base_class import Base
from sqlalchemy import Column,Integer,JSON,String,DateTime,Text,ForeignKey
from sqlalchemy.orm import relationship


class Evaluation(Base):
    
    id = Column(Integer, primary_key=True, index=True)
    track_name = Column(String,nullable=False)
    batch_name = Column(String,nullable=False)
    project_type = Column(String,nullable=False)
    code_freezing_time = Column(DateTime,nullable=False)
    questions = Column(JSON,nullable=True)
    requirements = Column(Text,nullable=False)
    user_evaluations = relationship("UserEvaluation")
    users = relationship("User",secondary="userevaluation",back_populates="evaluations")
    
    
    