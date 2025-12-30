"""
Image Upload API endpoints

Requirements covered:
- 1.1: Upload button opens file picker (frontend)
- 1.2: Accept PNG, JPG, JPEG formats
- 1.3: Display error for invalid formats
- 1.5: Limit file size to 10MB
- 1.6: Reject files exceeding 10MB
"""
from fastapi import APIRouter, HTTPException

from app.models.upload import (
    ImageUploadRequest,
    ImageUploadResponse,
    ErrorResponse
)
from app.services.image_service import ImageService, ImageValidationError

router = APIRouter()


@router.get("/upload/status")
async def upload_status():
    """Check upload endpoint status"""
    return {"status": "ready"}


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image"},
        413: {"model": ErrorResponse, "description": "File too large"}
    }
)
async def upload_image(request: ImageUploadRequest):
    """
    Upload a base64 encoded floor plan image.
    
    Accepts PNG, JPG, and JPEG formats up to 10MB.
    
    The image data can be provided as:
    - Raw base64 string
    - Data URI format (e.g., "data:image/png;base64,...")
    """
    try:
        result = ImageService.process_upload(
            base64_image=request.image,
            filename=request.filename
        )
        
        return ImageUploadResponse(
            success=True,
            message="Image uploaded successfully",
            image_id=result["image_id"],
            width=result["width"],
            height=result["height"],
            format=result["format"],
            size_bytes=result["size_bytes"]
        )
        
    except ImageValidationError as e:
        error_msg = str(e)
        
        # Determine appropriate status code
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
            detail={"success": False, "error": f"Internal error: {str(e)}"}
        )
