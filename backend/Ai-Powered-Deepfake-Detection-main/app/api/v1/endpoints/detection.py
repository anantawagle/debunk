import datetime
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Header, Form
from sqlalchemy.orm import Session # type: ignore
from typing import List,Optional
import os
import shutil
import json
from pathlib import Path
from app.db.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.detection import DetectionCreate, DetectionResponse, DetectionUpdate, DetectionList
from app.crud import detection as crud_detection
from app.config import settings
from app.services.image_detector import analyze_image, analyze_video, analyze_text

router = APIRouter()

# Create upload directory if it doesn't exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=DetectionResponse, status_code=status.HTTP_201_CREATED)
async def upload_content(
    file: UploadFile = File(None),
    content_type: str = Form(..., description="Type of content: 'image', 'video', 'text'"),
    text_content: str = Form(None, description="Text content if type is 'text'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload content for detection"""
    if content_type not in ['image', 'video', 'text']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Must be 'image', 'video', or 'text'"
        )

    if content_type == 'text':
        if not text_content or len(text_content.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content must be at least 20 characters"
            )
        # Create detection record for text
        detection_data = DetectionCreate(
            content_name="text_content",
            content_size=len(text_content.encode('utf-8')),
            content_type='text',
            content_text=text_content.strip()
        )
        detection = crud_detection.create_detection(db, detection_data, current_user.id)
    
        try:
            result = analyze_text(detection.content_text)
            update_data = DetectionUpdate(
                is_ai_generated=result["is_ai_generated"],
                confidence_score=result["confidence_score"],
                model_used=result["model_used"],
                detection_details=result["detection_details"],
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)
        except Exception as e:
            print(f"Text analysis failed: {e}")
            update_data = DetectionUpdate(
                is_ai_generated=False,
                confidence_score=0.0,
                model_used="Analysis Failed",
                detection_details=json.dumps({"error": str(e)}),
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)

        return detection

    # For image/video, require file
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required for image/video content"
        )

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )

    # Read file to check size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
        )

    # Create unique filename
    filename = f"{current_user.id}_{int(datetime.now(timezone.utc).timestamp())}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # Create detection record
    detection_data = DetectionCreate(
        content_path=file_path,
        content_name=file.filename,
        content_size=len(contents),
        content_type=content_type
    )

    detection = crud_detection.create_detection(db, detection_data, current_user.id)

    if detection.content_type == 'image':
        try:
            result = analyze_image(detection.content_path)
            update_data = DetectionUpdate(
                is_ai_generated=result["is_ai_generated"],
                confidence_score=result["confidence_score"],
                model_used=result["model_used"],
                detection_details=result["detection_details"],
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)
        except Exception as e:
            print(f"Image analysis failed: {e}")
            update_data = DetectionUpdate(
                is_ai_generated=False,
                confidence_score=0.0,
                model_used="Analysis Failed",
                detection_details=json.dumps({"error": str(e)}),
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)

    elif detection.content_type == 'video':
        try:
            result = analyze_video(detection.content_path)
            update_data = DetectionUpdate(
                is_ai_generated=result["is_ai_generated"],
                confidence_score=result["confidence_score"],
                model_used=result["model_used"],
                detection_details=result["detection_details"],
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)
        except Exception as e:
            print(f"Video analysis failed: {e}")
            update_data = DetectionUpdate(
                is_ai_generated=False,
                confidence_score=0.0,
                model_used="Analysis Failed",
                detection_details=json.dumps({"error": str(e)}),
                processed_at=datetime.now(timezone.utc)
            )
            detection = crud_detection.update_detection(db, detection.id, update_data)

    return detection

@router.get("/", response_model=DetectionList)
async def get_my_detections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's detection history"""
    detections = crud_detection.get_user_detections(db, current_user.id, skip, limit)
    total = crud_detection.get_detections_count(db, current_user.id)
    return {"total": total, "items": detections}

@router.get("/{detection_id}", response_model=DetectionResponse)
async def get_detection(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific detection by ID"""
    detection = crud_detection.get_detection(db, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )
    
    # Ensure user owns this detection
    if detection.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this detection"
        )
    
    return detection

@router.patch("/{detection_id}", response_model=DetectionResponse)
async def update_detection_result(
    detection_id: int,
    detection_update: DetectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update detection results (called by AI model service)"""
    detection = crud_detection.get_detection(db, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )
    
    # Ensure user owns this detection
    if detection.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this detection"
        )
    
    updated_detection = crud_detection.update_detection(db, detection_id, detection_update)
    return updated_detection


# AI MODEL INTEGRATION ENDPOINT

@router.post("/ai/process/{detection_id}", response_model=DetectionResponse)
async def ai_process_detection(
    detection_id: int,
    detection_update: DetectionUpdate,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
):
    """
    Endpoint for AI model to send detection results
    
    This endpoint should be called by your friend's AI service after processing the image.
    
    Example request:
    POST /api/v1/detections/ai/process/123
    Headers: X-API-Key: your-ai-service-key
    Body: {
        "is_ai_generated": true,
        "confidence_score": 0.95,
        "model_used": "ResNet50-Classifier",
        "detection_details": "{\"features\": [...], \"metadata\": {...}}"
    }
    """
    # Optional: Validate API key (configure in settings)
    # if x_api_key != settings.AI_SERVICE_API_KEY:
    #     raise HTTPException(status_code=401, detail="Invalid API key")
    
    detection = crud_detection.get_detection(db, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )
    
    # Update detection with AI results
    updated_detection = crud_detection.update_detection(db, detection_id, detection_update)
    
    return updated_detection

@router.get("/status/{detection_id}")
async def check_detection_status(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if AI has finished processing the image
    
    Returns:
    - status: "processing" | "completed"
    - detection: full detection object (only if completed)
    
    Frontend should poll this endpoint every few seconds after upload
    """
    detection = crud_detection.get_detection(db, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )
    
    # Ensure user owns this detection
    if detection.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this detection"
        )
    
    # Check if AI has processed it
    if detection.is_ai_generated is None:
        return {
            "status": "processing",
            "detection_id": detection_id,
            "message": "AI is still processing your image"
        }
    else:
        return {
            "status": "completed",
            "detection": DetectionResponse.from_orm(detection)
        }
@router.delete("/{detection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_detection(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a detection"""
    detection = crud_detection.get_detection(db, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection not found"
        )
    
    # Ensure user owns this detection
    if detection.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this detection"
        )
    
    # Delete file if exists
    if detection.content_path and os.path.exists(detection.content_path):
        os.remove(detection.content_path)
    
    crud_detection.delete_detection(db, detection_id)
    return None