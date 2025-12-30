"""
Qwen Vision API Endpoints

Provides endpoints for Alibaba Qwen VL based floor plan analysis.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import base64

from app.services.qwen_vision_service import (
    QwenVisionService,
    convert_to_homedata_rooms
)

router = APIRouter()


class QwenAnalyzeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image data")
    pixels_per_meter: float = Field(default=50.0)


class QwenAnalyzeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    homedata_rooms: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class QwenStatusResponse(BaseModel):
    configured: bool
    model: str
    message: str


@router.get("/qwen/status", response_model=QwenStatusResponse)
async def check_qwen_status() -> QwenStatusResponse:
    service = QwenVisionService()
    if service.is_configured():
        return QwenStatusResponse(
            configured=True,
            model=service.model,
            message="Qwen Vision service is configured and ready"
        )
    return QwenStatusResponse(
        configured=False,
        model=service.model,
        message="DashScope API key not configured. Set DASHSCOPE_API_KEY."
    )


@router.post("/qwen/analyze", response_model=QwenAnalyzeResponse)
async def analyze_floor_plan(request: QwenAnalyzeRequest) -> QwenAnalyzeResponse:
    service = QwenVisionService()
    
    if not service.is_configured():
        return QwenAnalyzeResponse(
            success=False,
            error="DashScope API key not configured. Set DASHSCOPE_API_KEY."
        )
    
    try:
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        result = await service.analyze_floor_plan(image_data)
        
        homedata_rooms = convert_to_homedata_rooms(
            result, 1000, 800, request.pixels_per_meter
        )
        
        return QwenAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
    except Exception as e:
        return QwenAnalyzeResponse(
            success=False,
            error=f"Qwen analysis failed: {str(e)}"
        )


@router.post("/qwen/analyze-with-dimensions", response_model=QwenAnalyzeResponse)
async def analyze_with_dimensions(
    request: QwenAnalyzeRequest,
    image_width: int = 1000,
    image_height: int = 800
) -> QwenAnalyzeResponse:
    service = QwenVisionService()
    
    if not service.is_configured():
        return QwenAnalyzeResponse(
            success=False,
            error="DashScope API key not configured. Set DASHSCOPE_API_KEY."
        )
    
    try:
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        result = await service.analyze_floor_plan(image_data)
        
        homedata_rooms = convert_to_homedata_rooms(
            result, image_width, image_height, request.pixels_per_meter
        )
        
        return QwenAnalyzeResponse(
            success=True,
            data=result.to_dict(),
            homedata_rooms=homedata_rooms
        )
    except Exception as e:
        return QwenAnalyzeResponse(
            success=False,
            error=f"Qwen analysis failed: {str(e)}"
        )
