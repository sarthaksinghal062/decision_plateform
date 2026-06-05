from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DecisionCreate(BaseModel):
    title: str

class CriteriaCreate(BaseModel):
    names: list[str]

class DecisionResponse(BaseModel):
    id: str
    title: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True