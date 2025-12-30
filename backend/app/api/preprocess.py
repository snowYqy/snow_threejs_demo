"""
Image Preprocessing API endpoints

Requirements covered:
- 2.1: Convert image to grayscale
- 2.2: Apply noise reduction filtering
- 2.3: Enhance contrast for better edge detection
- 2.4: Detect and correct image rotation if skewed
- 2.5: Normalize image resolution for consistent processing
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import base64
import io

from app.services.image_service import ImageService, ImageValidationError
from app.services.preprocessing import (
    ImagePreprocessor,
    PreprocessingConfig,
    preprocess_pil_image
)

router = APIRouter()


class PreprocessRequest(BaseModel):
    """Request model for image preprocessing"""
    image: str = Field(
        ...,
        description="Base64 encoded image data (with or without data URI prefix)"
    )
    filename: Optional[str] = Field(
        None,
        description="Original filename for format detection"
    )


class PreprocessResponse(BaseModel):
    """Response model for preprocessing result"""
    success: bool = True
    message: str = "Image preprocessed successfully"
    
    # Original image info
    original_width: int = Field(..., description="Original image width")
    original_height: int = Field(..., description="Original image height")
    
    # Processed image info
    processed_width: int = Field(..., description="Processed image width")
    processed_height: int = Field(..., description="Processed image height")
    
    # Preprocessing details
    rotation_angle: float = Field(..., description="Detected skew angle in degrees")
    was_rotated: bool = Field(..., description="Whether rotation correction was applied")
    scale_factor: float = Field(..., description="Scale factor applied for normalization")
    
    # Processed image data
    processed_image: str = Field(
        ..., 
        description="Base64 encoded preprocessed grayscale image"
    )


@router.post(
    "/preprocess",
    response_model=PreprocessResponse,
    responses={
        400: {"description": "Invalid image"},
        413: {"description": "File too large"}
    }
)
async def preprocess_image_endpoint(request: PreprocessRequest):
    """
    Preprocess a floor plan image for recognition.
    
    This endpoint performs the following preprocessing steps:
    1. Convert to grayscale
    2. Apply noise reduction
    3. Enhance contrast
    4. Detect and correct skew
    5. Normalize resolution
    
    Returns the preprocessed image along with preprocessing metadata.
    """
    try:
        # First validate and decode the image
        upload_result = ImageService.process_upload(
            base64_image=request.image,
            filename=request.filename
        )
        
        pil_image = upload_result["image"]
        
        # Run preprocessing pipeline
        result = preprocess_pil_image(pil_image)
        
        # Encode processed image to base64
        from PIL import Image
        processed_pil = ImagePreprocessor.cv2_to_pil(result.processed)
        
        buffer = io.BytesIO()
        processed_pil.save(buffer, format="PNG")
        processed_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return PreprocessResponse(
            success=True,
            message="Image preprocessed successfully",
            original_width=result.original_size[0],
            original_height=result.original_size[1],
            processed_width=result.processed_size[0],
            processed_height=result.processed_size[1],
            rotation_angle=result.rotation_angle,
            was_rotated=result.was_rotated,
            scale_factor=result.scale_factor,
            processed_image=f"data:image/png;base64,{processed_base64}"
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
            detail={"success": False, "error": f"Preprocessing error: {str(e)}"}
        )
