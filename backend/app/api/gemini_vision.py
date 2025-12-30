"""
Gemini Vision API Endpoints

Provides endpoints for Google Gemini based floor plan analysis.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import base64

from app.services.gemini_vision_service import (
    GeminiVisionService,
    convert_to_homedata_rooms
)

router = APIRouter()


class GeminiAnalyzeRequest(BaseModel):
    """Request model for Gemini floor plan analysis"""
    image: str = Field(..., description="Base64 encoded image data")
    pixels_per_meter: float = Field(
        default=50.0,
        description="Scale factor for coordinate conversion"
    )


class GeminiAnalyzeResponse(BaseModel):
    """Response model for Gemini analysis"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    homedata_rooms: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class GeminiStatusResponse(BaseModel):
    """Response model for Gemini status check"""
    configured: bool
    model: str
    message: str


@router.get("/gemini/status", response_model=GeminiStatusResponse)
async def check_gemini_status() -> GeminiStatusResponse:
    """Check if Gemini service is properly configured."""
    service = GeminiVisionService()
    
    if service.is_configured():
        return GeminiStatusResponse(
            configured=True,
            model=service.model,
            message="Gemini Vision service is configured and ready"
        )
    else:
        return GeminiStatusResponse(
            configured=False,
            model=service.model,
            message="Gemini API key not configured. Set GEMINI_API_KEY environment variable."
        )


@router.post("/gemini/analyze", response_model=GeminiAnalyzeResponse)
async def analyze_floor_plan(request: GeminiAnalyzeRequest) -> GeminiAnalyzeResponse:
    """Analyze a floor plan image using Gemini Vision."""
    service = GeminiVisionService()
    
    if not service.is_configured():
        return GeminiAnalyzeResponse(
            success=False,
            error="Gemini API key not configured. Set GEMINI_API_KEY environment variable."
        )
    
    try:
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        try:
            decoded = base64.b64decode(image_data)
        except Exception as e:
            return GeminiAnalyzeResponse(
                success=False,
                error=f"Invalid base64 image data: {str(e)}"
            )
        
        result = await service.analyze_floor_plan(image_data)
        
        estimated_width = 1000
        estimated_height = 800
        
        homedata_rooms = convert_to_homedata_rooms(
            result,
            estimated_width,
            estimated_height,
            request.pixels_per_meter
        )
        
        return GeminiAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
        
    except Exception as e:
        return GeminiAnalyzeResponse(
            success=False,
            error=f"Gemini analysis failed: {str(e)}"
        )


@router.post("/gemini/analyze-with-dimensions", response_model=GeminiAnalyzeResponse)
async def analyze_floor_plan_with_dimensions(
    request: GeminiAnalyzeRequest,
    image_width: int = 1000,
    image_height: int = 800
) -> GeminiAnalyzeResponse:
    """Analyze a floor plan image with known dimensions."""
    service = GeminiVisionService()
    
    if not service.is_configured():
        return GeminiAnalyzeResponse(
            success=False,
            error="Gemini API key not configured. Set GEMINI_API_KEY environment variable."
        )
    
    try:
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        result = await service.analyze_floor_plan(image_data)
        
        homedata_rooms = convert_to_homedata_rooms(
            result,
            image_width,
            image_height,
            request.pixels_per_meter
        )
        
        return GeminiAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
        
    except Exception as e:
        return GeminiAnalyzeResponse(
            success=False,
            error=f"Gemini analysis failed: {str(e)}"
        )
