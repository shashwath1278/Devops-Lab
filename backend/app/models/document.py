from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    tags: List[str] = []

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: UUID
    file_url: str
    file_path: str
    uploaded_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True
