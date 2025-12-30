"""
Wall Detection API endpoints

Requirements covered:
- 3.1: Identify wall segments using edge detection
- 3.2: Distinguish between exterior and interior walls
- 3.3: Detect wall thickness
- 3.4: Output wall coordinates as line segments
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import base64
import io

from app.services.image_service import ImageService, ImageValidationError
from app.services.preprocessing import preprocess_pil_image, ImagePreprocessor
from app.services.wall_detection import (
    WallDetector,
    WallDetectionConfig,
    detect_walls
)

router = APIRouter()


class WallDetectionRequest(BaseModel):
    """Request model for wall detection"""
    image: str = Field(
        ...,
        description="Base64 encoded image data (with or without data URI prefix)"
    )
    filename: Optional[str] = Field(
        None,
        description="Original filename for format detection"
    )
    options: Optional[dict] = Field(
        None,
        description="Optional detection parameters"
    )


class WallInfo(BaseModel):
    """Wall segment information"""
    start: List[int] = Field(..., description="Start point [x, y]")
    end: List[int] = Field(..., description="End point [x, y]")
    thickness: float = Field(..., description="Wall thickness in pixels")
    wall_type: str = Field(..., description="Wall type: exterior, interior, or unknown")
    confidence: float = Field(..., description="Detection confidence 0-1")
    length: float = Field(..., description="Wall length in pixels")
    angle: float = Field(..., description="Wall angle in degrees")


class WallDetectionResponse(BaseModel):
    """Response model for wall detection result"""
    success: bool = True
    message: str = "Walls detected successfully"
    
    # Image info
    image_width: int = Field(..., description="Image width")
    image_height: int = Field(..., description="Image height")
    
    # Detection results
    walls: List[WallInfo] = Field(..., description="Detected wall segments")
    wall_count: int = Field(..., description="Total number of walls detected")
    exterior_wall_count: int = Field(..., description="Number of exterior walls")
    interior_wall_count: int = Field(..., description="Number of interior walls")
    
    # Debug images (base64 encoded)
    edges_image: Optional[str] = Field(
        None,
        description="Base64 encoded edge detection result"
    )
    binary_image: Optional[str] = Field(
        None,
        description="Base64 encoded binary image"
    )


@router.post(
    "/detect-walls",
    response_model=WallDetectionResponse,
    responses={
        400: {"description": "Invalid image"},
        413: {"description": "File too large"}
    }
)
async def detect_walls_endpoint(request: WallDetectionRequest):
    """
    Detect walls in a floor plan image.
    
    This endpoint performs the following steps:
    1. Preprocess the image (grayscale, denoise, enhance)
    2. Detect edges using Canny edge detection
    3. Detect lines using Hough transform
    4. Merge nearby line segments
    5. Classify walls as exterior or interior
    6. Estimate wall thickness
    
    Returns detected wall segments with metadata.
    """
    try:
        # Validate and decode the image
        upload_result = ImageService.process_upload(
            base64_image=request.image,
            filename=request.filename
        )
        
        pil_image = upload_result["image"]
        
        # Preprocess the image
        preprocess_result = preprocess_pil_image(pil_image)
        
        # Detect walls
        detection_result = detect_walls(preprocess_result.processed)
        
        # Convert walls to response format
        walls_info = []
        for wall in detection_result.walls:
            walls_info.append(WallInfo(
                start=list(wall.start),
                end=list(wall.end),
                thickness=wall.thickness,
                wall_type=wall.wall_type.value,
                confidence=wall.confidence,
                length=wall.length,
                angle=wall.angle
            ))
        
        # Encode debug images
        edges_base64 = None
        binary_base64 = None
        
        include_debug = request.options and request.options.get("include_debug", False)
        
        if include_debug:
            # Encode edges image
            from PIL import Image
            edges_pil = Image.fromarray(detection_result.edges_image)
            buffer = io.BytesIO()
            edges_pil.save(buffer, format="PNG")
            edges_base64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
            
            # Encode binary image
            binary_pil = Image.fromarray(detection_result.binary_image)
            buffer = io.BytesIO()
            binary_pil.save(buffer, format="PNG")
            binary_base64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        
        # Count wall types
        exterior_count = len([w for w in detection_result.walls if w.wall_type.value == "exterior"])
        interior_count = len([w for w in detection_result.walls if w.wall_type.value == "interior"])
        
        return WallDetectionResponse(
            success=True,
            message="Walls detected successfully",
            image_width=detection_result.image_size[0],
            image_height=detection_result.image_size[1],
            walls=walls_info,
            wall_count=len(detection_result.walls),
            exterior_wall_count=exterior_count,
            interior_wall_count=interior_count,
            edges_image=edges_base64,
            binary_image=binary_base64
        )
        
    except ImageValidationError as e:
        error_msg = str(e)
        
        if "exceeds maximum" in error_msg.lower():
            raise HTTPException(
                status_code=413,
                detail={"success": False, "error": error_msg}
            )
        else:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": error_msg}
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": f"Wall detection error: {str(e)}"}
        )
