from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional


class User(BaseModel):
    email_id: str
    github_url: str
    deployed_url: str
    full_name: Optional[str] = Field(description="User full name", default="")


class CreateEvaluationRequest(BaseModel):
    track_name: str
    batch_name: str
    project_type: str
    code_freezing_time: datetime
    requirements: str
    users: List[User]
    extensions: str = Field(description="List of extensions.", default="")
    questions: Optional[List[str]] = Field(
        description="Optional list of questions form the admin.", default=None, min_length=5, max_length=100)


class EvaluationReport(BaseModel):
    report:str
    
class StartEvaluationRequest(BaseModel):
    evaluation_id: int
    email: str
    extensions: str = Field(description="List of extensions.", default="")
    
class UploadCompleteRequest(BaseModel):
    upload_id: str
    key: str
    parts: list
    
class VideoRecord(BaseModel):
    url: str
    timestamp: datetime
    filename: str