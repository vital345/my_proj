# admin_store.py

from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from core.config import settings
# from sqlalchemy.orm import sessionmaker, Session
from typing import Literal
from db.session import SessionLocal
import fitz  # PyMuPDF
from db.base_class import Base


# Database model
class ProjectData(Base):
    __tablename__ = "project_data"
    id = Column(Integer, primary_key=True, index=True)
    json_data = Column(JSON, nullable=False)

# Pydantic schemas
class Milestone(BaseModel):
    Milestone: str
    BulletPoints: list[str]

class Page(BaseModel):
    Page: str
    ExpectedPage: str

class Endpoint(BaseModel):
    Url: str
    Description: str

class FrontendProjectData(BaseModel):
    PDF: str
    ListOfMilestones: list[Milestone]
    Tech_Stack: str
    Github_URL: str
    ProjectType: Literal["Frontend"]
    isPixelPerfect: bool
    ListOfPages: list[Page]

class BackendProjectData(BaseModel):
    PDF: str
    ListOfMilestones: list[Milestone]
    Tech_Stack: str
    Github_URL: str
    ProjectType: Literal["Backend"]
    ListOfEndpoints: list[Endpoint]

# CRUD operation
def create_project_data(db: SessionLocal(), project_data: BaseModel):
    db_project_data = ProjectData(json_data=project_data.dict())
    db.add(db_project_data)
    db.commit()
    db.refresh(db_project_data)
    return db_project_data

# Utility function to parse PDF
def parse_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text





# import os
# import json

# import shutil
# from services.core.admin_store import (
#     SessionLocal, 
#     FrontendProjectData, 
#     BackendProjectData, 
#     create_project_data, 
#     parse_pdf
# )
# from db.session import get_db


# @app.post("/store-json/")
# async def store_json(
#     file: UploadFile = File(...),
#     project_type: str = Form(...),
#     tech_stack: str = Form(...),
#     github_url: str = Form(...),
#     milestones: str = Form(...),
#     is_pixel_perfect: bool = Form(None),
#     pages: str = Form(None),
#     endpoints: str = Form(None),
#     db: Session = Depends(get_db)
# ):
#     # Ensure the temp directory exists
#     os.makedirs("temp", exist_ok=True)
    
#     file_path = f"temp/{file.filename}"
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
    
#     pdf_text = parse_pdf(file_path)
    
#     # Parse the milestones, pages, and endpoints from the form data
#     try:
#         milestones_list = json.loads(milestones)
#         pages_list = json.loads(pages) if pages else []
#         endpoints_list = json.loads(endpoints) if endpoints else []
#     except json.JSONDecodeError as e:
#         raise HTTPException(status_code=400, detail=f"Invalid JSON format: {e}")

#     data = {
#         "PDF": pdf_text,
#         "ListOfMilestones": milestones_list,
#         "Tech_Stack": tech_stack,
#         "Github_URL": github_url,
#         "ProjectType": project_type,
#     }

#     if project_type == "Frontend":
#         data["isPixelPerfect"] = is_pixel_perfect
#         data["ListOfPages"] = pages_list
#         validated_data = FrontendProjectData(**data)
#     elif project_type == "Backend":
#         data["ListOfEndpoints"] = endpoints_list
#         validated_data = BackendProjectData(**data)
#     else:
#         raise HTTPException(status_code=400, detail="Invalid ProjectType")
    
#     project_data = create_project_data(db=db, project_data=validated_data)
#     return {"id": project_data.id}
