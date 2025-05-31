from schemas.user import CreateUser
from sqlalchemy.orm import Session
from db.models.user import User
from core.hashing import Hasher

def create_user(user:CreateUser,db:Session):
    # print(user)
    user = User(
        username=user.username,
        password=Hasher.get_password_hash(user.password),
        role=user.role
)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def get_user_by_id(user_id:int,db:Session):
    user:User = db.query(User).where(User.id == user_id).first()
    return user
    