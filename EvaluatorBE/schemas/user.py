from pydantic import BaseModel,validator
from db.repository.login import get_user
from db.session import SessionLocal

class CreateUser(BaseModel):
    username:str 
    password:str
    role:str
    
    @validator("username")
    def validate_username(cls,value):
        db = SessionLocal()
        user = get_user(value,db)
        db.close()
        if(user):
            raise ValueError(f"username:{value} already exists")
        return value
            

class UserResponse(BaseModel):
    id:int 
    username:str 
    role:str
    
    class Config:  # tells pydantic to convert even non dict obj to json
        orm_mode = True