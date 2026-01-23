from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_path = Column(String, nullable=True)  # For files
    content_text = Column(Text, nullable=True)  # For text content
    content_name = Column(String, nullable=False)
    content_size = Column(Integer, nullable=False)  # in bytes
    content_type = Column(String, nullable=False)  # 'image', 'text', 'video'

    # Detection results
    is_ai_generated = Column(Boolean, nullable=True)  # True = AI, False = Real
    confidence_score = Column(Float, nullable=True)  # 0-1
    model_used = Column(String, nullable=True)
    detection_details = Column(Text, nullable=True)  # JSON string for additional details

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="detections")