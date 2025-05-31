from datetime import datetime
from pydantic import BaseModel
from typing import List,Literal


class CreateChat(BaseModel):
    evaluation_id:int
    user_id:int
    session_type:Literal["project_specific_qa","domain_specific_qa"]
