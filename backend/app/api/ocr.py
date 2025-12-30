"""
OCR API Endpoints

Requirements covered:
- 5.1: Use OCR to detect text in the image
- 5.2: Identify room type keywords
- 5.3: Associate labels with their nearest room
- 5.4: Assign default name when no label detected
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import base64
import numpy as np
import cv2

from app.services.ocr_service import (
    OCRService,
    LabelAssociator,
    TextLabel,
    RoomLabelAssociation,
    OCRResult,
    RoomType,
    DEFAULT_ROOM_NAMES
)

router = APIRouter()


class OCRRequest(BaseModel):
    """Request model for OCR text detection"""
    image: str = Field(..., description="Base64 encoded image data")
    language: Optional[str] = Field(
        None, 
        description="OCR language (default: chi_sim+eng)"
    )


class OCRResponse(BaseModel):
    """Response model for OCR text detection"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class LabelAssociationRequest(BaseModel):
    """Request model for label-room association"""
    image: str = Field(..., description="Base64 encoded image data")
    rooms: List[Dict[str, Any]] = Field(
        ..., 
        description="List of detected rooms from room detection"
    )
    language: Optional[str] = Field(
        None, 
        description="OCR language (default: chi_sim+eng)"
    )


class LabelAssociationResponse(BaseModel):
    """Response model for label-room association"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode a base64 encoded image to numpy array.
    
    Args:
        base64_string: Base64 encoded image data
        
    Returns:
        OpenCV image (BGR format)
    """
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    image_bytes = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image")
    
    return image


@router.post("/ocr/detect", response_model=OCRResponse)
async def detect_text(request: OCRRequest) -> OCRResponse:
    """
    Detect text in a floor plan image using OCR.
    
    Requirement 5.1: THE Label_Extractor SHALL use OCR to detect text in the image.
    Requirement 5.2: THE Label_Extractor SHALL identify room type keywords.
    
    Args:
        request: OCRRequest with base64 image and optional language
        
    Returns:
        OCRResponse with detected text labels
    """
    try:
        # Decode image
        image = decode_base64_image(request.image)
        
        # Run OCR
        ocr_service = OCRService()
        result = ocr_service.detect_text(image, request.language)
        
        return OCRResponse(
            success=True,
            data=result.to_dict()
        )
        
    except ValueError as e:
        return OCRResponse(
            success=False,
            error=f"Invalid image: {str(e)}"
        )
    except Exception as e:
        return OCRResponse(
            success=False,
            error=f"OCR detection failed: {str(e)}"
        )


@router.post("/ocr/associate", response_model=LabelAssociationResponse)
async def associate_labels(request: LabelAssociationRequest) -> LabelAssociationResponse:
    """
    Detect text and associate labels with rooms.
    
    Requirement 5.3: THE Label_Extractor SHALL associate labels with their nearest room.
    Requirement 5.4: WHEN no label is detected for a room, THE System SHALL 
    assign a default name based on size/position.
    
    Args:
        request: LabelAssociationRequest with image and rooms data
        
    Returns:
        LabelAssociationResponse with room-label associations
    """
    try:
        # Decode image
        image = decode_base64_image(request.image)
        height, width = image.shape[:2]
        
        # Run OCR
        ocr_service = OCRService()
        ocr_result = ocr_service.detect_text(image, request.language)
        
        # Associate labels with rooms
        associator = LabelAssociator()
        associations = associator.associate_labels(
            rooms=request.rooms,
            labels=ocr_result.labels,
            image_size=(width, height)
        )
        
        return LabelAssociationResponse(
            success=True,
            data={
                "associations": [a.to_dict() for a in associations],
                "detected_labels": ocr_result.to_dict(),
                "room_count": len(request.rooms),
                "labeled_count": sum(1 for a in associations if not a.is_default_name),
                "default_count": sum(1 for a in associations if a.is_default_name)
            }
        )
        
    except ValueError as e:
        return LabelAssociationResponse(
            success=False,
            error=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        return LabelAssociationResponse(
            success=False,
            error=f"Label association failed: {str(e)}"
        )


@router.get("/ocr/room-types")
async def get_room_types() -> Dict[str, Any]:
    """
    Get available room types and their default names.
    
    Returns:
        Dictionary of room types and default names
    """
    return {
        "room_types": [rt.value for rt in RoomType],
        "default_names": {rt.value: name for rt, name in DEFAULT_ROOM_NAMES.items()}
    }
