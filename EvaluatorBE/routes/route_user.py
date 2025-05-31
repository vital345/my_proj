from fastapi import APIRouter,Depends,status
from schemas.user import CreateUser,UserResponse
from sqlalchemy.orm import Session
from db.repository.user import create_user,get_user_by_id
from db.session import get_db

router = APIRouter()



@router.post("/",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
def create_a_user(user:CreateUser,db:Session = Depends(get_db)):
    user = create_user(user,db)
    return user

@router.get("/{user_id}/")
def get_a_user(user_id:int,db:Session = Depends(get_db)):
    return get_user_by_id(user_id,db)
    
