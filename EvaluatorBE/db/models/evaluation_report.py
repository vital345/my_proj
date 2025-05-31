from pkg_resources import Requirement
from db.base_class import Base
from sqlalchemy import Column,Integer,JSON,String,DateTime,Text,ForeignKey,Enum
from sqlalchemy.orm import relationship


class EvaluationReport(Base):
    
    id = Column(type_=Integer, primary_key=True, index=True)
    userevaluation_id = Column(Integer, ForeignKey("userevaluation.id"))
    report_data = Column(JSON)