from typing import Optional
from pydantic import BaseModel
class Question(BaseModel):
    question:str
    
class FinalReport(BaseModel):
    score:int 
    explanation:str 
    
class Output(BaseModel):
    output: FinalReport | Question
    
class QuestionResponse(BaseModel):
    question:str
    code_snippet: Optional[str]