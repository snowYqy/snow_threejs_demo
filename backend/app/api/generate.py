"""
HomeData Generation API endpoint

Converts recognition results to homeData.json format for 3D rendering.
Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import base64
import io

from app.services.image_service import ImageService, ImageValidationError
from app.services.preprocessing import preprocess_pil_image
from app.services.wall_detection import detect_walls
from app.services.room_detection import detect_rooms, RoomShape

router = APIRouter()

# Room type colors
ROOM_COLORS = {
    'living': '#F5E6D3',
    'dining': '#E8D5B7',
    'kitchen': '#FADBD8',
    'bedroom': '#D4E6F1',
    'bathroom': '#E8DAEF',
    'balcony': '#ABEBC6',
    'study': '#FCF3CF',
    'hallway': '#D5DBDB',
    'other': '#E5E8E8',
}

# Room type inference based on size and position
def infer_room_type(room_index: int, area: float, aspect_ratio: float, total_rooms: int) -> str:
    """Infer room type based on characteristics"""
    # Largest room is usually living room
    if room_index == 0 and area > 15:
        return 'living'
    # Second largest might be dining or another living area
    if room_index == 1 and area > 12:
        return 'dining'
    # Small rooms with aspect ratio close to 1 might be bathroom
    if area < 6 and 0.6 < aspect_ratio < 1.6:
        return 'bathroom'
    # Very small rooms might be storage/closet
    if area < 4:
        return 'hallway'
    # Medium rooms are usually bedrooms
    if 6 <= area <= 20:
        return 'bedroom'
    # Narrow rooms might be hallway or balcony
    if aspect_ratio < 0.4 or aspect_ratio > 2.5:
        return 'balcony'
    return 'bedroom'


class RecognizeAndGenerateRequest(BaseModel):
    """Request model for full recognition and generation"""
    image: str = Field(..., description="Base64 encoded image data")
    filename: Optional[str] = Field(None, description="Original filename")
    scale: Optional[float] = Field(50.0, description="Pixels per meter")
    wall_height: Optional[float] = Field(3.0, description="Wall height in meters")
    room_names: Optional[Dict[str, str]] = Field(None, description="Custom room names")


class RoomInfo(BaseModel):
    """Room information in homeData format"""
    id: str
    name: str
    type: str
    position: List[float]
    size: List[float]
    color: str
    devices: List[dict]


class HomeDataResponse(BaseModel):
    """Response with generated homeData"""
    success: bool = True
    message: str = "HomeData generated successfully"
    homeData: dict
    recognition_info: dict


@router.post(
    "/recognize-and-generate",
    response_model=HomeDataResponse,
    responses={
        400: {"description": "Invalid image"},
        500: {"description": "Processing error"}
    }
)
async def recognize_and_generate(request: RecognizeAndGenerateRequest):
    """
    Full pipeline: Upload image -> Recognize -> Generate homeData
    
    This endpoint performs:
    1. Image preprocessing
    2. Wall detection
    3. Room detection
    4. Coordinate conversion (pixels to meters)
    5. HomeData JSON generation
    """
    try:
        # Step 1: Validate and decode image
        upload_result = ImageService.process_upload(
            base64_image=request.image,
            filename=request.filename
        )
        pil_image = upload_result["image"]
        
        # Step 2: Preprocess
        preprocess_result = preprocess_pil_image(pil_image)
        
        # Step 3: Detect walls
        wall_result = detect_walls(preprocess_result.processed)
        
        # Step 4: Detect rooms
        room_result = detect_rooms(wall_result.binary_image)
        
        if len(room_result.rooms) == 0:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "无法识别房间，请上传更清晰的户型图"}
            )
        
        # Step 5: Convert to homeData format
        scale = request.scale or 50.0  # pixels per meter
        wall_height = request.wall_height or 3.0
        
        # Calculate image center for coordinate transformation
        img_width, img_height = room_result.image_size
        center_x = img_width / 2
        center_y = img_height / 2
        
        # Sort rooms by area (largest first)
        sorted_rooms = sorted(room_result.rooms, key=lambda r: r.area, reverse=True)
        
        # Generate room data
        rooms_data = []
        for i, room in enumerate(sorted_rooms):
            # Convert pixel coordinates to meters (centered at origin)
            room_center_x = (room.center[0] - center_x) / scale
            room_center_z = (room.center[1] - center_y) / scale
            room_width = room.width / scale
            room_depth = room.height / scale
            
            # Infer room type
            area_m2 = room_width * room_depth
            aspect = room_width / room_depth if room_depth > 0 else 1
            room_type = infer_room_type(i, area_m2, aspect, len(sorted_rooms))
            
            # Get custom name or generate default
            room_id = f"room-{i+1}"
            if request.room_names and room_id in request.room_names:
                room_name = request.room_names[room_id]
            else:
                type_names = {
                    'living': '客厅',
                    'dining': '餐厅',
                    'kitchen': '厨房',
                    'bedroom': '卧室',
                    'bathroom': '卫生间',
                    'balcony': '阳台',
                    'study': '书房',
                    'hallway': '走廊',
                    'other': f'房间{i+1}'
                }
                room_name = type_names.get(room_type, f'房间{i+1}')
                # Add number suffix for duplicate types
                same_type_count = sum(1 for r in rooms_data if r['type'] == room_type)
                if same_type_count > 0:
                    room_name = f"{room_name}{same_type_count + 1}"
            
            rooms_data.append({
                'id': room_id,
                'name': room_name,
                'type': room_type,
                'position': [round(room_center_x, 2), round(room_center_z, 2)],
                'size': [round(room_width, 2), round(room_depth, 2)],
                'color': ROOM_COLORS.get(room_type, ROOM_COLORS['other']),
                'devices': [
                    {
                        'id': f'{room_id}-light',
                        'type': 'light',
                        'name': f'{room_name}灯',
                        'offset': [0, 0],
                        'isOn': True
                    }
                ]
            })
        
        # Build homeData
        home_data = {
            'meta': {
                'version': '2.0',
                'name': '识别户型',
                'unit': 'meter',
                'wallHeight': wall_height,
                'wallThickness': 0.1
            },
            'rooms': rooms_data,
            'walls': []
        }
        
        # Recognition info for debugging
        recognition_info = {
            'image_size': {'width': img_width, 'height': img_height},
            'scale_used': scale,
            'rooms_detected': len(room_result.rooms),
            'walls_detected': len(wall_result.walls),
            'preprocessing': {
                'rotation_applied': preprocess_result.was_rotated,
                'rotation_angle': preprocess_result.rotation_angle,
                'scale_factor': preprocess_result.scale_factor
            }
        }
        
        return HomeDataResponse(
            success=True,
            message=f"成功识别 {len(rooms_data)} 个房间",
            homeData=home_data,
            recognition_info=recognition_info
        )
        
    except ImageValidationError as e:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": str(e)}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": f"处理错误: {str(e)}"}
        )
