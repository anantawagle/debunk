from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Image Detector API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024  # 20MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm", ".avi", ".mkv", ".txt"}
    UPLOAD_DIR: str = "uploads"
    
    # App URLs
    APP_URL: str = "http://localhost:5173"
    API_URL: str = "http://localhost:8000"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()