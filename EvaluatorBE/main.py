import base64
from http.client import HTTPException
import json
import os
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile,Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr
from routes.route_login import router as login_router
from routes.route_user import router as user_router
from routes.route_evaluation import router as evaluation_router
from routes.route_screen_recording import router as screen_recording_router
from services.core.mails import send_email
from services.ai.agents.image_comparator import image_comparator
from services.core.evaluations.take_evaluation import take_evaluation
from db.session import get_db
from sqlalchemy.orm import Session
from db.models.user_evaluation import UserEvaluation
from services.ai.agents.domain_specific_qa.predefined_questions_qa_agent import predefined_questions_qa_agent
from services.ai.speech_processing.speech_to_text import convert_speech_to_text
from services.ai.speech_processing.text_to_speech import convert_text_to_speech
from fastapi.responses import FileResponse
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from contextlib import asynccontextmanager

try:
    print("Loading environment variables from .env file...")
    load_dotenv(dotenv_path=".env", override=True)
except:
    print(".env file not found. Please check the file path.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    creds = os.environ.get("GOOGLE_CREDENTIALS_JSON", "{}")
    creds = json.loads(creds)
    with open("/tmp/vertexai.json", "w") as file:
        json.dump(creds, file)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/vertexai.json"
    os.environ["GCP_PROJECT"] = creds["project_id"]
    os.environ["GCP_LOCATION"] = os.environ.get("GCP_LOCATION", "us-central1")
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "*"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(user_router,prefix="/create_user")
app.include_router(login_router,prefix="/login")
app.include_router(evaluation_router,prefix="/evaluation")
app.include_router(screen_recording_router,prefix="/recordings")

def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

@app.get("/")
def index():
    return {
        "message":"Success"
    }
