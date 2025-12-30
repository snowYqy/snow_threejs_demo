"""
Gemini Vision Service for Floor Plan Recognition

Uses Google Gemini API to analyze floor plan images and extract room information.
Gemini has free tier with generous limits.

Requirements covered:
- 4.1: Identify enclosed areas as rooms
- 4.2: Calculate room center position
- 4.3: Calculate room dimensions (width, depth)
- 5.1: Use OCR to detect text in the image
- 5.2: Identify room type keywords
"""
import os
import base64
import json
import httpx
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class RoomType(Enum):
    """Room type classification"""
    LIVING = "living"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    BALCONY = "balcony"
    DINING = "dining"
    STUDY = "study"
    STORAGE = "storage"
    HALLWAY = "hallway"
    OTHER = "other"


@dataclass
class DetectedRoom:
    """Represents a room detected by Vision AI"""
    id: str
    name: str
    type: RoomType
    bounds: Dict[str, float]  # x, y, width, height as percentages (0-100)
    confidence: float
    area_estimate: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "bounds": self.bounds,
            "confidence": self.confidence,
            "area_estimate": self.area_estimate
        }


@dataclass
class GeminiAnalysisResult:
    """Result of Gemini Vision floor plan analysis"""
    rooms: List[DetectedRoom]
    total_rooms: int
    has_scale: bool
    scale_info: Optional[str]
    raw_response: str
    
    def to_dict(self) -> dict:
        return {
            "rooms": [r.to_dict() for r in self.rooms],
            "total_rooms": self.total_rooms,
            "has_scale": self.has_scale,
            "scale_info": self.scale_info
        }


# System prompt for floor plan analysis
FLOOR_PLAN_ANALYSIS_PROMPT = """你是一个专业的户型图分析专家。请分析这张户型图图片，识别所有房间并返回结构化的JSON数据。

请严格按照以下JSON格式返回结果，不要包含任何其他文字，只返回JSON：

{
  "rooms": [
    {
      "id": "room-1",
      "name": "客厅",
      "type": "living",
      "bounds": {
        "x": 10,
        "y": 20,
        "width": 30,
        "height": 25
      },
      "confidence": 0.95,
      "area_estimate": 25.5
    }
  ],
  "total_rooms": 5,
  "has_scale": true,
  "scale_info": "1:100"
}

字段说明：
- id: 房间唯一标识，格式为 "room-N"
- name: 房间名称（中文），如果图中有标注就用标注的名称，否则根据房间特征推断
- type: 房间类型，必须是以下之一：living, bedroom, kitchen, bathroom, balcony, dining, study, storage, hallway, other
- bounds: 房间边界框，使用百分比坐标（0-100），x和y是左上角位置，width和height是宽高
- confidence: 识别置信度（0-1）
- area_estimate: 估算面积（平方米），如果无法估算则为null
- has_scale: 图中是否有比例尺
- scale_info: 比例尺信息，如果没有则为null

注意事项：
1. 请识别所有可见的房间，包括卧室、客厅、厨房、卫生间、阳台等
2. bounds坐标是相对于整张图片的百分比位置
3. 如果房间名称在图中有标注，请使用标注的名称
4. 忽略家具、门窗等细节，只关注房间区域
5. 只返回JSON，不要有任何其他说明文字"""


class GeminiVisionService:
    """
    Gemini Vision service for floor plan analysis.
    
    Uses Google's Gemini API which has a generous free tier.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini Vision service.
        
        Args:
            api_key: Google Gemini API key. If not provided, reads from GEMINI_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.api_base = "https://generativelanguage.googleapis.com/v1beta"
        self.model = "models/gemini-2.0-flash"  # Full model path with vision support
        
    def is_configured(self) -> bool:
        """Check if the service is properly configured with an API key."""
        return bool(self.api_key)

    async def analyze_floor_plan(
        self, 
        image_base64: str,
    ) -> GeminiAnalysisResult:
        """
        Analyze a floor plan image using Gemini Vision.
        
        Args:
            image_base64: Base64 encoded image data
            
        Returns:
            GeminiAnalysisResult with detected rooms
            
        Raises:
            ValueError: If API key is not configured
            Exception: If API call fails
        """
        if not self.is_configured():
            raise ValueError(
                "Gemini API key not configured. "
                "Set GEMINI_API_KEY environment variable or pass api_key to constructor."
            )
        
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Detect image type
        image_type = self._detect_image_type(image_base64)
        
        # Prepare the API request
        url = f"{self.api_base}/{self.model}:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": FLOOR_PLAN_ANALYSIS_PROMPT},
                        {
                            "inline_data": {
                                "mime_type": f"image/{image_type}",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 4096
            }
        }
        
        # Make the API call
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            
            if response.status_code != 200:
                error_detail = response.text
                raise Exception(f"Gemini API error: {response.status_code} - {error_detail}")
            
            result = response.json()
        
        # Extract the response content
        try:
            raw_response = result["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise Exception(f"Unexpected Gemini response format: {result}")
        
        # Parse the JSON response
        return self._parse_response(raw_response)
    
    def _detect_image_type(self, base64_data: str) -> str:
        """Detect image type from base64 data."""
        try:
            header = base64.b64decode(base64_data[:32])
            if header[:8] == b'\x89PNG\r\n\x1a\n':
                return "png"
            elif header[:2] == b'\xff\xd8':
                return "jpeg"
            elif header[:6] in (b'GIF87a', b'GIF89a'):
                return "gif"
            elif header[:4] == b'RIFF' and header[8:12] == b'WEBP':
                return "webp"
        except:
            pass
        return "jpeg"
    
    def _parse_response(self, raw_response: str) -> GeminiAnalysisResult:
        """Parse the Gemini response into structured data."""
        json_str = self._extract_json(raw_response)
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            return GeminiAnalysisResult(
                rooms=[],
                total_rooms=0,
                has_scale=False,
                scale_info=None,
                raw_response=raw_response
            )
        
        rooms = []
        for i, room_data in enumerate(data.get("rooms", [])):
            try:
                room = DetectedRoom(
                    id=room_data.get("id", f"room-{i+1}"),
                    name=room_data.get("name", f"房间{i+1}"),
                    type=self._parse_room_type(room_data.get("type", "other")),
                    bounds=room_data.get("bounds", {"x": 0, "y": 0, "width": 0, "height": 0}),
                    confidence=float(room_data.get("confidence", 0.5)),
                    area_estimate=room_data.get("area_estimate")
                )
                rooms.append(room)
            except Exception as e:
                print(f"Warning: Failed to parse room {i}: {e}")
                continue
        
        return GeminiAnalysisResult(
            rooms=rooms,
            total_rooms=data.get("total_rooms", len(rooms)),
            has_scale=data.get("has_scale", False),
            scale_info=data.get("scale_info"),
            raw_response=raw_response
        )
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text that may contain markdown code blocks."""
        import re
        
        json_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
        if json_match:
            return json_match.group(1).strip()
        
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json_match.group(0)
        
        return text
    
    def _parse_room_type(self, type_str: str) -> RoomType:
        """Parse room type string to enum."""
        type_map = {
            "living": RoomType.LIVING,
            "bedroom": RoomType.BEDROOM,
            "kitchen": RoomType.KITCHEN,
            "bathroom": RoomType.BATHROOM,
            "balcony": RoomType.BALCONY,
            "dining": RoomType.DINING,
            "study": RoomType.STUDY,
            "storage": RoomType.STORAGE,
            "hallway": RoomType.HALLWAY,
            "other": RoomType.OTHER,
        }
        return type_map.get(type_str.lower(), RoomType.OTHER)


def convert_to_homedata_rooms(
    gemini_result: GeminiAnalysisResult,
    image_width: int,
    image_height: int,
    pixels_per_meter: float = 50.0
) -> List[Dict[str, Any]]:
    """Convert Gemini result to homeData room format."""
    color_map = {
        RoomType.LIVING: "#E8D4B8",
        RoomType.BEDROOM: "#B8D4E8",
        RoomType.KITCHEN: "#D4E8B8",
        RoomType.BATHROOM: "#E8B8D4",
        RoomType.BALCONY: "#D4B8E8",
        RoomType.DINING: "#E8E8B8",
        RoomType.STUDY: "#B8E8D4",
        RoomType.STORAGE: "#D4D4D4",
        RoomType.HALLWAY: "#E8E8E8",
        RoomType.OTHER: "#C8C8C8",
    }
    
    rooms = []
    center_x = image_width / 2
    center_y = image_height / 2
    
    for room in gemini_result.rooms:
        px_x = (room.bounds["x"] / 100) * image_width
        px_y = (room.bounds["y"] / 100) * image_height
        px_width = (room.bounds["width"] / 100) * image_width
        px_height = (room.bounds["height"] / 100) * image_height
        
        room_center_px_x = px_x + px_width / 2
        room_center_px_y = px_y + px_height / 2
        
        pos_x = (room_center_px_x - center_x) / pixels_per_meter
        pos_z = (room_center_px_y - center_y) / pixels_per_meter
        
        width = px_width / pixels_per_meter
        depth = px_height / pixels_per_meter
        
        rooms.append({
            "id": room.id,
            "name": room.name,
            "type": room.type.value,
            "position": {"x": round(pos_x, 2), "y": 0, "z": round(pos_z, 2)},
            "size": {"width": round(width, 2), "height": 3, "depth": round(depth, 2)},
            "color": color_map.get(room.type, "#C8C8C8"),
            "devices": []
        })
    
    return rooms
