"""
Room Detection API endpoints

Requirements covered:
- 4.1: Identify enclosed areas as rooms
- 4.2: Calculate room center position
- 4.3: Calculate room dimensions (width, depth)
- 4.4: Detect room shape (rectangular, L-shaped, etc.)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import base64
import io

from app.services.image_service import ImageService, ImageValidationError
from app.services.preprocessing import preprocess_pil_image
from app.services.wall_detection import detect_walls
from app.services.room_detection import (
    RoomDetector,
    RoomDetectionConfig,
    detect_rooms
)

router = APIRouter()


class RoomDetectionRequest(BaseModel):
    """Request model for room detection"""
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


class RoomBounds(BaseModel):
    """Room bounding rectangle"""
    x: int = Field(..., description="X coordinate of top-left corner")
    y: int = Field(..., description="Y coordinate of top-left corner")
    width: int = Field(..., description="Room width in pixels")
    height: int = Field(..., description="Room height (depth) in pixels")


class RoomCenter(BaseModel):
    """Room center position"""
    x: float = Field(..., description="X coordinate of center")
    y: float = Field(..., description="Y coordinate of center")


class RoomVertex(BaseModel):
    """Room polygon vertex"""
    x: int = Field(..., description="X coordinate")
    y: int = Field(..., description="Y coordinate")


class RoomInfo(BaseModel):
    """Detected room information"""
    id: str = Field(..., description="Unique room identifier")
    bounds: RoomBounds = Field(..., description="Bounding rectangle")
    center: RoomCenter = Field(..., description="Center position")
    area: float = Field(..., description="Room area in pixels")
    perimeter: float = Field(..., description="Room perimeter in pixels")
    shape: str = Field(..., description="Room shape: rectangular, l_shaped, etc.")
    confidence: float = Field(..., description="Detection confidence 0-1")
    vertices: List[RoomVertex] = Field(..., description="Polygon vertices")
    aspect_ratio: float = Field(..., description="Width to height ratio")
    rectangularity: float = Field(..., description="How rectangular the room is")


class RoomDetectionResponse(BaseModel):
    """Response model for room detection result"""
    success: bool = True
    message: str = "Rooms detected successfully"
    
    # Image info
    image_width: int = Field(..., description="Image width")
    image_height: int = Field(..., description="Image height")
    
    # Detection results
    rooms: List[RoomInfo] = Field(..., description="Detected rooms")
    room_count: int = Field(..., description="Total number of rooms detected")
    total_room_area: float = Field(..., description="Sum of all room areas")
    shape_distribution: Dict[str, int] = Field(
        ..., 
        description="Count of each room shape type"
    )
    
    # Debug images (base64 encoded)
    filled_image: Optional[str] = Field(
        None,
        description="Base64 encoded filled walls image"
    )
    contour_image: Optional[str] = Field(
        None,
        description="Base64 encoded contour visualization"
    )


@router.post(
    "/detect-rooms",
    response_model=RoomDetectionResponse,
    responses={
        400: {"description": "Invalid image"},
        413: {"description": "File too large"}
    }
)
async def detect_rooms_endpoint(request: RoomDetectionRequest):
    """
    Detect rooms in a floor plan image.
    
    This endpoint performs the following steps:
    1. Preprocess the image (grayscale, denoise, enhance)
    2. Detect walls to get binary image
    3. Fill walls to create closed regions
    4. Find contours representing rooms
    5. Filter and analyze room shapes
    6. Calculate room centers and dimensions
    
    Returns detected rooms with metadata.
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
        
        # Detect walls first to get binary image
        wall_result = detect_walls(preprocess_result.processed)
        
        # Detect rooms using the binary image from wall detection
        room_result = detect_rooms(
            wall_result.binary_image,
            wall_result.edges_image
        )
        
        # Convert rooms to response format
        rooms_info = []
        for room in room_result.rooms:
            room_dict = room.to_dict()
            rooms_info.append(RoomInfo(
                id=room_dict["id"],
                bounds=RoomBounds(**room_dict["bounds"]),
                center=RoomCenter(**room_dict["center"]),
                area=room_dict["area"],
                perimeter=room_dict["perimeter"],
                shape=room_dict["shape"],
                confidence=room_dict["confidence"],
                vertices=[RoomVertex(**v) for v in room_dict["vertices"]],
                aspect_ratio=room_dict["aspect_ratio"],
                rectangularity=room_dict["rectangularity"]
            ))
        
        # Encode debug images
        filled_base64 = None
        contour_base64 = None
        
        include_debug = request.options and request.options.get("include_debug", False)
        
        if include_debug:
            from PIL import Image
            
            # Encode filled image
            filled_pil = Image.fromarray(room_result.filled_image)
            buffer = io.BytesIO()
            filled_pil.save(buffer, format="PNG")
            filled_base64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
            
            # Encode contour visualization
            # Convert BGR to RGB for PIL
            import cv2
            contour_rgb = cv2.cvtColor(room_result.contour_image, cv2.COLOR_BGR2RGB)
            contour_pil = Image.fromarray(contour_rgb)
            buffer = io.BytesIO()
            contour_pil.save(buffer, format="PNG")
            contour_base64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"
        
        # Get shape distribution
        shape_dist = room_result.to_dict()["shape_distribution"]
        
        return RoomDetectionResponse(
            success=True,
            message="Rooms detected successfully",
            image_width=room_result.image_size[0],
            image_height=room_result.image_size[1],
            rooms=rooms_info,
            room_count=len(room_result.rooms),
            total_room_area=room_result.total_room_area,
            shape_distribution=shape_dist,
            filled_image=filled_base64,
            contour_image=contour_base64
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
            detail={"success": False, "error": f"Room detection error: {str(e)}"}
        )
