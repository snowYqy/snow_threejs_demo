"""
Upload request/response models
"""
from pydantic import BaseModel, Field
from typing import Optional


class ImageUploadRequest(BaseModel):
    """Request model for image upload"""
    image: str = Field(
        ...,
        description="Base64 encoded image data (with or without data URI prefix)"
    )
    filename: Optional[str] = Field(
        None,
        description="Original filename for format detection"
    )


class ImageUploadResponse(BaseModel):
    """Response model for successful image upload"""
    success: bool = True
    message: str = "Image uploaded successfully"
    image_id: str = Field(..., description="Unique identifier for the uploaded image")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    format: str = Field(..., description="Detected image format")
    size_bytes: int = Field(..., description="Image size in bytes")


class ErrorResponse(BaseModel):
    """Response model for errors"""
    success: bool = False
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
