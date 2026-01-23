from pydantic import BaseModel
from typing import Optional, Union
from datetime import datetime

class DetectionBase(BaseModel):
    content_name: str
    content_size: int
    content_type: str  # 'image', 'text', 'video'

class DetectionCreate(DetectionBase):
    content_path: Optional[str] = None  # For files
    content_text: Optional[str] = None  # For text content

class DetectionUpdate(BaseModel):
    is_ai_generated: Optional[bool] = None
    confidence_score: Optional[float] = None
    model_used: Optional[str] = None
    detection_details: Optional[str] = None
    processed_at: Optional[datetime] = None

class DetectionResponse(DetectionBase):
    id: int
    user_id: int
    content_path: Optional[str]
    content_text: Optional[str]
    is_ai_generated: Optional[bool]
    confidence_score: Optional[float]
    model_used: Optional[str]
    detection_details: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True

class DetectionList(BaseModel):
    total: int
    items: list[DetectionResponse]