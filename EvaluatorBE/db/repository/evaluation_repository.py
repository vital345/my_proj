from sqlalchemy.orm import Session, lazyload, joinedload
from db.models.evaluation import Evaluation
from schemas.evaluation import CreateEvaluationRequest
from db.models.user_evaluation import UserEvaluation
from db.models.user import User
from db.models.user_evaluation import UserEvaluation
from db.models.evaluation_step import EvaluationStep
from fastapi import HTTPException
def create_evaluation(request: CreateEvaluationRequest, db: Session) -> Evaluation:
    
    evaluation = Evaluation(
        track_name=request.track_name,
        batch_name=request.batch_name,
        project_type=request.project_type,
        code_freezing_time=request.code_freezing_time,
        requirements=request.requirements,
        questions = request.questions
    )

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    for user in request.users:
        stored_user = db.query(User).where(
            User.username == user.email_id).first()
        if (stored_user == None):
            stored_user = User(
                username=user.email_id,
                password="default",
                role="user",
                full_name=user.full_name
            )
        stored_user.full_name = user.full_name or stored_user.full_name
        db.add(stored_user)
        db.commit()
        db.refresh(stored_user)

        db.add(
            UserEvaluation(
                user_id=stored_user.id,
                evaluation_id=evaluation.id,
                deployed_url=user.deployed_url,
                github_url=user.github_url
            ))

    db.commit()
    db.refresh(evaluation)
    return db.query(Evaluation).where(Evaluation.id == evaluation.id).options(joinedload(Evaluation.users)).first()


def get_all_evaluations(db: Session):
    evaluations = db.query(Evaluation).options(
        joinedload(Evaluation.users)).all()
    return evaluations


def get_single_evaluation_by_id(id: int, db: Session):
    # print(id)
    evaluation = db.query(Evaluation).where(Evaluation.id == id).options(
        joinedload(Evaluation.users), joinedload(Evaluation.user_evaluations)).first()
    
    def get_is_complete(evaluation:Evaluation,user:User):
        
        n = len(list(filter(lambda x:x.user_id == user.id ,evaluation.user_evaluations))[0].evaluation_steps)
        
        if n == 0 : return 'Pending'
        if n < 6: return 'In progress'
        return "Complete"
        
    return {
        "id": evaluation.id,
        "batch_name": evaluation.batch_name,
        "track_name": evaluation.track_name,
        "requirements": evaluation.requirements,
        "project_type": evaluation.project_type,
        "code_freezing_time": evaluation.code_freezing_time,
        "users": [
            {
                "id": user.id,
                "email": user.username,
                "github_url": next((x.github_url for x in evaluation.user_evaluations if x.user_id == user.id), None),
                "deployed_url": next((x.deployed_url for x in evaluation.user_evaluations if x.user_id == user.id), None),
                "is_complete": get_is_complete(evaluation,user),
                "full_name": user.full_name
            }
            for user in evaluation.users
        ]
    }


def get_evaluation_status_of_user(evaluation_id:int,user_id:int,db:Session):
    userEvaluation:UserEvaluation = db.query(
        UserEvaluation).where(
            UserEvaluation.user_id == user_id).where(
                UserEvaluation.evaluation_id == evaluation_id
            ).first()
    return userEvaluation.evaluation_steps

def update_evaluation_step(evaluation_id:int,user_id:int,step_name:str,step_data:any,db:Session):
    userEvaluation:UserEvaluation = db.query(
        UserEvaluation).where(
            UserEvaluation.user_id == user_id).where(
                UserEvaluation.evaluation_id == evaluation_id
            ).first()
    if(not userEvaluation):
        raise HTTPException(status_code=400,detail={
            'status':"bad_request",
            'errors': [
                "invalid evaluation id or user id"
            ]
        })
    
    evaluation_step = db.query(EvaluationStep).where(
        EvaluationStep.userevaluation_id == userEvaluation.id).where(
            EvaluationStep.step_name == step_name
        ).first()
    
    evaluation_step.step_report = step_data
    db.add(evaluation_step)
    db.commit()
    db.refresh(evaluation_step)
    return evaluation_step
    