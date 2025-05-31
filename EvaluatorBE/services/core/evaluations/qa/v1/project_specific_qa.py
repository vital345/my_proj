from sqlalchemy.orm import Session
from db.models.evaluation_step import EvaluationStep
from db.models.user_evaluation import UserEvaluation
from db.models.chat_session import ChatSession
from db.models.chat_history import ChatHistory 
from services.ai.agents.project_specific_qa_agent import project_specific_qa_agent,Question
import subprocess
import tempfile
from services.core.clone_repository import clone_github_repo
from db.models.user import User
from db.chat_history import get_chat_history


def project_specific_qa(chat_id:int,query:str,db:Session):
    
    user_evaluation_id:int = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first().userevaluation_id
    
    userEvaluation:UserEvaluation = db.query(UserEvaluation).where(
        UserEvaluation.id == user_evaluation_id
        ).first()
    
    user:User = db.query(User).where(User.id == userEvaluation.user_id).first()
    
    chatSession:ChatSession = db.query(
        ChatSession).where(
            ChatSession.id == chat_id).first()
    
    
    if(
        db.query(
            EvaluationStep).where(
                 EvaluationStep.step_name == 'project_specific_qa'
                ).where(
                    EvaluationStep.userevaluation_id == userEvaluation.id
                ).first() != None
        ):
        
        return {
            "question":None,
            "is_complete":True,
            "errors":[
                "evaluation already completed"
            ]
        }
        
    cloned_repo_path = clone_github_repo(userEvaluation.github_url,user.username)  
    temporary_file =  tempfile.NamedTemporaryFile(dir="./.tmp")
    subprocess.run(f'repomix "{cloned_repo_path}" -o "{temporary_file.name}"',shell=True)
    repo_string = temporary_file.read()
    temporary_file.close()
    result = project_specific_qa_agent(chat_id,repo_string,query)
    
    if(isinstance(result,Question)):
            return {
                "question":result.question,
                "is_complete":False,
                "errors":[]
            }
            
    else:
            chat_history = get_chat_history(chat_id).messages
            chat_history = [message.model_dump() for message in chat_history]
            db.add(
                EvaluationStep(
                    userevaluation_id = userEvaluation.id, 
                    step_name = 'project_specific_qa',
                    step_report = {
                        "score" : result.score,
                        "explanation" : result.explanation,
                        "questions": chat_history
                    }
                    )
                )
            db.commit()
            
            db.query(ChatHistory).where(ChatHistory.session_id == chatSession.id).delete()
            
            db.commit()
            
            return {
                "question":None,
                "is_complete":True,
                "errors":[]
            }
        
    
    