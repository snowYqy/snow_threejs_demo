"""
Qwen Vision Service for Floor Plan Recognition

Uses Alibaba Cloud Qwen (通义千问) VL API to analyze floor plan images.
Qwen VL has good Chinese support and generous free tier.

Get API Key from: https://dashscope.console.aliyun.com/apiKey

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
    bounds: Dict[str, float]
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
class QwenAnalysisResult:
    """Result of Qwen Vision floor plan analysis"""
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


FLOOR_PLAN_ANALYSIS_PROMPT = """你是一个专业的户型图分析专家。请仔细分析这张户型图，精确识别每个房间的位置和大小。

分析要求：
1. 仔细观察墙体线条（黑色粗线），确定每个房间的精确边界
2. 读取图中标注的房间名称
3. 房间之间不能重叠，必须紧密相邻
4. 所有房间组合起来应该形成完整的户型轮廓

坐标系说明：
- 图片左上角为原点 (0, 0)
- x 轴向右为正，y 轴向下为正
- 所有坐标使用百分比 (0-100)
- bounds.x 和 bounds.y 是房间左上角的位置
- bounds.width 和 bounds.height 是房间的宽度和高度

请返回以下JSON格式（只返回JSON，不要其他文字）：

{
  "rooms": [
    {
      "id": "room-1",
      "name": "客厅",
      "type": "living",
      "bounds": {"x": 5, "y": 10, "width": 40, "height": 35},
      "confidence": 0.95
    },
    {
      "id": "room-2", 
      "name": "主卧",
      "type": "bedroom",
      "bounds": {"x": 45, "y": 10, "width": 30, "height": 35},
      "confidence": 0.9
    }
  ],
  "total_rooms": 2,
  "has_scale": false,
  "scale_info": null
}

房间类型(type)必须是以下之一：
living(客厅), bedroom(卧室), kitchen(厨房), bathroom(卫生间), 
balcony(阳台), dining(餐厅), study(书房), storage(储物间), 
hallway(走廊/玄关), other(其他)

注意事项：
- 确保相邻房间的边界精确对齐，不要有间隙或重叠
- 房间位置要准确反映户型图中的实际布局
- 从左到右、从上到下的顺序排列房间"""


class QwenVisionService:
    """Qwen Vision service for floor plan analysis."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.api_base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.model = "qwen-vl-max"  # 使用最强的视觉模型
        
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def analyze_floor_plan(self, image_base64: str) -> QwenAnalysisResult:
        if not self.is_configured():
            raise ValueError(
                "DashScope API key not configured. "
                "Set DASHSCOPE_API_KEY environment variable."
            )
        
        # Handle data URL prefix
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_type = self._detect_image_type(image_base64)
        image_url = f"data:image/{image_type};base64,{image_base64}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": FLOOR_PLAN_ANALYSIS_PROMPT}
                    ]
                }
            ],
            "max_tokens": 4096,
            "temperature": 0.1
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"Qwen API error: {response.status_code} - {response.text}")
            
            result = response.json()
        
        raw_response = result["choices"][0]["message"]["content"]
        return self._parse_response(raw_response)
    
    def _detect_image_type(self, base64_data: str) -> str:
        try:
            header = base64.b64decode(base64_data[:32])
            if header[:8] == b'\x89PNG\r\n\x1a\n':
                return "png"
            elif header[:2] == b'\xff\xd8':
                return "jpeg"
        except:
            pass
        return "jpeg"
    
    def _parse_response(self, raw_response: str) -> QwenAnalysisResult:
        json_str = self._extract_json(raw_response)
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            return QwenAnalysisResult(
                rooms=[], total_rooms=0, has_scale=False,
                scale_info=None, raw_response=raw_response
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
            except Exception:
                continue
        
        return QwenAnalysisResult(
            rooms=rooms,
            total_rooms=data.get("total_rooms", len(rooms)),
            has_scale=data.get("has_scale", False),
            scale_info=data.get("scale_info"),
            raw_response=raw_response
        )
    
    def _extract_json(self, text: str) -> str:
        import re
        json_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
        if json_match:
            return json_match.group(1).strip()
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json_match.group(0)
        return text
    
    def _parse_room_type(self, type_str: str) -> RoomType:
        type_map = {
            "living": RoomType.LIVING, "bedroom": RoomType.BEDROOM,
            "kitchen": RoomType.KITCHEN, "bathroom": RoomType.BATHROOM,
            "balcony": RoomType.BALCONY, "dining": RoomType.DINING,
            "study": RoomType.STUDY, "storage": RoomType.STORAGE,
            "hallway": RoomType.HALLWAY, "other": RoomType.OTHER,
        }
        return type_map.get(type_str.lower(), RoomType.OTHER)


def convert_to_homedata_rooms(
    result: QwenAnalysisResult,
    image_width: int,
    image_height: int,
    pixels_per_meter: float = 50.0
) -> List[Dict[str, Any]]:
    """
    将 AI 识别结果转换为 3D 房间数据。
    
    坐标转换说明：
    - AI 返回的是图片百分比坐标 (0-100)
    - 3D 场景使用米为单位，原点在场景中心
    - 需要将图片坐标转换为以场景中心为原点的 3D 坐标
    """
    color_map = {
        RoomType.LIVING: "#E8D4B8", RoomType.BEDROOM: "#B8D4E8",
        RoomType.KITCHEN: "#D4E8B8", RoomType.BATHROOM: "#E8B8D4",
        RoomType.BALCONY: "#D4B8E8", RoomType.DINING: "#E8E8B8",
        RoomType.STUDY: "#B8E8D4", RoomType.STORAGE: "#D4D4D4",
        RoomType.HALLWAY: "#E8E8E8", RoomType.OTHER: "#C8C8C8",
    }
    
    rooms = []
    
    # 计算所有房间的边界，用于确定整体户型范围
    if not result.rooms:
        return rooms
    
    # 找出所有房间的整体边界
    min_x = min(r.bounds["x"] for r in result.rooms)
    min_y = min(r.bounds["y"] for r in result.rooms)
    max_x = max(r.bounds["x"] + r.bounds["width"] for r in result.rooms)
    max_y = max(r.bounds["y"] + r.bounds["height"] for r in result.rooms)
    
    # 户型整体尺寸（百分比）
    total_width_pct = max_x - min_x
    total_height_pct = max_y - min_y
    
    # 户型中心点（百分比）
    center_x_pct = min_x + total_width_pct / 2
    center_y_pct = min_y + total_height_pct / 2
    
    # 将百分比转换为像素，再转换为米
    # 使用较小的缩放因子让房间更紧凑
    scale_factor = min(image_width, image_height) / pixels_per_meter / 100
    
    for room in result.rooms:
        # 房间在图片中的位置（百分比）
        room_x = room.bounds["x"]
        room_y = room.bounds["y"]
        room_w = room.bounds["width"]
        room_h = room.bounds["height"]
        
        # 房间中心点（百分比）
        room_center_x_pct = room_x + room_w / 2
        room_center_y_pct = room_y + room_h / 2
        
        # 相对于户型中心的偏移（百分比）
        offset_x_pct = room_center_x_pct - center_x_pct
        offset_y_pct = room_center_y_pct - center_y_pct
        
        # 转换为米（3D 坐标）
        # x 轴：向右为正
        # z 轴：向下为正（对应图片 y 轴）
        pos_x = offset_x_pct * scale_factor
        pos_z = offset_y_pct * scale_factor
        
        # 房间尺寸（米）
        width = room_w * scale_factor
        depth = room_h * scale_factor
        
        rooms.append({
            "id": room.id,
            "name": room.name,
            "type": room.type.value,
            "position": {"x": round(pos_x, 2), "y": 0, "z": round(pos_z, 2)},
            "size": {
                "width": round(max(width, 1), 2),  # 最小 1 米
                "height": 3,
                "depth": round(max(depth, 1), 2)   # 最小 1 米
            },
            "color": color_map.get(room.type, "#C8C8C8"),
            "devices": []
        })
    
    return rooms
