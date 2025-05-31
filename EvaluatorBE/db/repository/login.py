from db.models.user import User
from sqlalchemy.orm import Session


def get_user(username: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    return user
