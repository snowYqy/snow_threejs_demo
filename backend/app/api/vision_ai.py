"""
Vision AI API Endpoints

Provides endpoints for GPT-4 Vision based floor plan analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import base64

from app.services.vision_ai_service import (
    VisionAIService,
    VisionAnalysisResult,
    convert_to_homedata_rooms
)

router = APIRouter()


class VisionAnalyzeRequest(BaseModel):
    """Request model for Vision AI floor plan analysis"""
    image: str = Field(..., description="Base64 encoded image data")
    detail: str = Field(
        default="high",
        description="Image detail level: 'low', 'high', or 'auto'"
    )
    pixels_per_meter: float = Field(
        default=50.0,
        description="Scale factor for coordinate conversion"
    )


class VisionAnalyzeResponse(BaseModel):
    """Response model for Vision AI analysis"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    homedata_rooms: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class VisionStatusResponse(BaseModel):
    """Response model for Vision AI status check"""
    configured: bool
    model: str
    message: str


@router.get("/vision/status", response_model=VisionStatusResponse)
async def check_vision_status() -> VisionStatusResponse:
    """
    Check if Vision AI service is properly configured.
    
    Returns:
        VisionStatusResponse with configuration status
    """
    service = VisionAIService()
    
    if service.is_configured():
        return VisionStatusResponse(
            configured=True,
            model=service.model,
            message="Vision AI service is configured and ready"
        )
    else:
        return VisionStatusResponse(
            configured=False,
            model=service.model,
            message="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
        )


@router.post("/vision/analyze", response_model=VisionAnalyzeResponse)
async def analyze_floor_plan(request: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    """
    Analyze a floor plan image using GPT-4 Vision.
    
    This endpoint provides high-accuracy room detection by leveraging
    multimodal AI capabilities. It returns both the raw analysis result
    and converted homeData format rooms.
    
    Args:
        request: VisionAnalyzeRequest with base64 image
        
    Returns:
        VisionAnalyzeResponse with detected rooms
    """
    service = VisionAIService()
    
    if not service.is_configured():
        return VisionAnalyzeResponse(
            success=False,
            error="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Remove data URL prefix if present
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Validate base64
        try:
            decoded = base64.b64decode(image_data)
            image_size = len(decoded)
        except Exception as e:
            return VisionAnalyzeResponse(
                success=False,
                error=f"Invalid base64 image data: {str(e)}"
            )
        
        # Analyze the floor plan
        result = await service.analyze_floor_plan(image_data, request.detail)
        
        # Estimate image dimensions from decoded data
        # For simplicity, we'll use a default size and let the frontend provide actual dimensions
        # In production, you'd want to decode the image and get actual dimensions
        estimated_width = 1000
        estimated_height = 800
        
        # Convert to homeData format
        homedata_rooms = convert_to_homedata_rooms(
            result,
            estimated_width,
            estimated_height,
            request.pixels_per_meter
        )
        
        return VisionAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
        
    except ValueError as e:
        return VisionAnalyzeResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        return VisionAnalyzeResponse(
            success=False,
            error=f"Vision AI analysis failed: {str(e)}"
        )


@router.post("/vision/analyze-with-dimensions", response_model=VisionAnalyzeResponse)
async def analyze_floor_plan_with_dimensions(
    request: VisionAnalyzeRequest,
    image_width: int = 1000,
    image_height: int = 800
) -> VisionAnalyzeResponse:
    """
    Analyze a floor plan image with known dimensions.
    
    This endpoint is similar to /vision/analyze but allows specifying
    the actual image dimensions for more accurate coordinate conversion.
    
    Args:
        request: VisionAnalyzeRequest with base64 image
        image_width: Actual image width in pixels
        image_height: Actual image height in pixels
        
    Returns:
        VisionAnalyzeResponse with detected rooms
    """
    service = VisionAIService()
    
    if not service.is_configured():
        return VisionAnalyzeResponse(
            success=False,
            error="OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Remove data URL prefix if present
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Analyze the floor plan
        result = await service.analyze_floor_plan(image_data, request.detail)
        
        # Convert to homeData format with actual dimensions
        homedata_rooms = convert_to_homedata_rooms(
            result,
            image_width,
            image_height,
            request.pixels_per_meter
        )
        
        return VisionAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
        
    except Exception as e:
        return VisionAnalyzeResponse(
            success=False,
            error=f"Vision AI analysis failed: {str(e)}"
        )
