from sqlalchemy import create_engine
from core.config import settings
from sqlalchemy.orm import sessionmaker
from typing import Generator

engine = create_engine(settings.DB_URL)

SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

def get_db() -> Generator:  
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
