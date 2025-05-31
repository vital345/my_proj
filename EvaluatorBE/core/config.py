import os

class Settings:
    APP_NAME = os.getenv("APP_NAME")
    APP_VERSION = os.getenv("APP_VERSION")
    DB_URL = os.getenv("DB_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30

        
settings = Settings()
