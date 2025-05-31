from typing import Optional
from pydantic import BaseModel, Field


class Question(BaseModel):
    # """Question to be asked to the user"""
    question: str = Field(description="question text you want to ask the user")
    code_snippet: Optional[str] = Field(
        None, description="An optimal code snippet related to the question."
    )


class QARequest(BaseModel):
    answer: str


class InputQuestion(BaseModel):
    question: Question = Field(description="The question text")
    clean_session: bool = Field(default=False, description="Flag to indicate if the session should be cleaned")







