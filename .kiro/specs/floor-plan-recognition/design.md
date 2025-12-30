# Design Document: 2D 户型图识别转 3D 模型

## Overview

本设计文档描述如何实现从 2D 户型图图片自动识别并生成 3D 智能家居模型的完整技术方案。

## 技术方案选型

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案A: 纯前端 CV.js** | 无需后端，部署简单 | 识别精度有限，无法处理复杂户型 | ⭐⭐ |
| **方案B: 云端 AI API** | 精度高，支持复杂场景 | 需要付费，依赖网络 | ⭐⭐⭐⭐ |
| **方案C: 自建 Python 后端** | 可定制，精度可控 | 需要部署后端服务 | ⭐⭐⭐⭐⭐ |
| **方案D: 混合方案** | 平衡精度和成本 | 架构复杂 | ⭐⭐⭐⭐ |

### 推荐方案：方案C + 方案B 混合

1. **基础识别**：使用 OpenCV + Python 后端进行墙体/房间检测
2. **文字识别**：使用云端 OCR API（如 Tesseract 或云服务）
3. **智能增强**：可选接入 GPT-4 Vision 进行复杂户型理解

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ ImageUpload  │  │ EditCanvas   │  │ Preview3D            │  │
│  │ Component    │  │ (校正界面)   │  │ (现有FloorPlan)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FloorPlanRecognitionStore (Zustand)         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Python FastAPI)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Preprocessor │  │ WallDetector │  │ RoomDetector         │  │
│  │ (OpenCV)     │  │ (OpenCV)     │  │ (Contour Analysis)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ OCR Engine   │  │ DoorWindow   │  │ DataGenerator        │  │
│  │ (Tesseract)  │  │ Detector     │  │ (JSON Output)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. ImageUploadPanel

```tsx
interface ImageUploadPanelProps {
  onImageSelect: (file: File) => void;
  onRecognize: () => void;
  isProcessing: boolean;
}
```

#### 2. RecognitionEditCanvas

```tsx
interface RecognitionEditCanvasProps {
  originalImage: string;
  recognizedRooms: RecognizedRoom[];
  onRoomUpdate: (roomId: string, updates: Partial<RecognizedRoom>) => void;
  onRoomAdd: (room: RecognizedRoom) => void;
  onRoomDelete: (roomId: string) => void;
}

interface RecognizedRoom {
  id: string;
  name: string;
  type: RoomType;
  bounds: {
    x: number;      // 像素坐标
    y: number;
    width: number;
    height: number;
  };
  confidence: number;  // 识别置信度 0-1
}
```

#### 3. RecognitionPreview3D

```tsx
interface RecognitionPreview3DProps {
  homeData: HomeData | null;
  onConfirm: () => void;
  onRegenerate: () => void;
}
```

### Backend API Endpoints

#### POST /api/recognize

```python
# Request
{
  "image": "base64_encoded_image_data",
  "options": {
    "scale_hint": 0.05,  # 可选：每像素代表多少米
    "wall_threshold": 50,  # 墙体检测阈值
    "min_room_area": 1000  # 最小房间面积（像素）
  }
}

# Response
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room-1",
        "name": "客厅",
        "type": "living",
        "bounds": { "x": 100, "y": 50, "width": 300, "height": 200 },
        "confidence": 0.92
      }
    ],
    "walls": [
      { "start": [0, 0], "end": [500, 0], "thickness": 10 }
    ],
    "doors": [
      { "position": [250, 0], "width": 40 }
    ],
    "scale": {
      "pixelsPerMeter": 50,
      "estimated": true
    },
    "imageSize": { "width": 800, "height": 600 }
  }
}
```

#### POST /api/generate-homedata

```python
# Request
{
  "rooms": [...],  # 校正后的房间数据
  "scale": { "pixelsPerMeter": 50 },
  "options": {
    "wallHeight": 3,
    "centerOrigin": true
  }
}

# Response
{
  "success": true,
  "homeData": {
    "meta": { ... },
    "rooms": [ ... ],
    "walls": []
  }
}
```

## Data Models

### Recognition Result

```typescript
interface RecognitionResult {
  rooms: RecognizedRoom[];
  walls: WallSegment[];
  doors: DoorInfo[];
  windows: WindowInfo[];
  scale: ScaleInfo;
  imageSize: { width: number; height: number };
}

interface WallSegment {
  start: [number, number];
  end: [number, number];
  thickness: number;
}

interface DoorInfo {
  position: [number, number];
  width: number;
  wallId?: string;
}

interface ScaleInfo {
  pixelsPerMeter: number;
  estimated: boolean;
  referenceLength?: number;
}
```

### Coordinate Transformation

```typescript
// 像素坐标 → 米制坐标
function pixelToMeter(
  pixelCoord: [number, number],
  scale: ScaleInfo,
  imageSize: { width: number; height: number }
): [number, number] {
  const centerX = imageSize.width / 2;
  const centerY = imageSize.height / 2;
  
  return [
    (pixelCoord[0] - centerX) / scale.pixelsPerMeter,
    (pixelCoord[1] - centerY) / scale.pixelsPerMeter
  ];
}
```

## 核心算法

### 1. 墙体检测算法

```python
def detect_walls(image):
    # 1. 灰度化
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 2. 二值化
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # 3. 形态学操作 - 连接断开的墙体
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    # 4. 霍夫线变换检测直线
    lines = cv2.HoughLinesP(binary, 1, np.pi/180, 50, 
                            minLineLength=30, maxLineGap=10)
    
    # 5. 合并相近的线段
    walls = merge_nearby_lines(lines)
    
    return walls
```

### 2. 房间检测算法

```python
def detect_rooms(binary_image, walls):
    # 1. 填充墙体形成封闭区域
    filled = fill_walls(binary_image, walls)
    
    # 2. 查找轮廓
    contours, _ = cv2.findContours(filled, cv2.RETR_EXTERNAL, 
                                    cv2.CHAIN_APPROX_SIMPLE)
    
    rooms = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > MIN_ROOM_AREA:
            # 3. 获取边界矩形
            x, y, w, h = cv2.boundingRect(contour)
            
            # 4. 计算中心点
            center = (x + w/2, y + h/2)
            
            rooms.append({
                'bounds': {'x': x, 'y': y, 'width': w, 'height': h},
                'center': center,
                'area': area
            })
    
    return rooms
```

### 3. OCR 文字识别

```python
def extract_labels(image):
    # 使用 Tesseract OCR
    custom_config = r'--oem 3 --psm 11 -l chi_sim+eng'
    
    data = pytesseract.image_to_data(image, config=custom_config, 
                                      output_type=pytesseract.Output.DICT)
    
    labels = []
    for i, text in enumerate(data['text']):
        if text.strip():
            labels.append({
                'text': text,
                'position': (data['left'][i], data['top'][i]),
                'confidence': data['conf'][i]
            })
    
    return labels
```

### 4. 房间类型推断

```python
ROOM_TYPE_KEYWORDS = {
    'living': ['客厅', '起居室', 'living'],
    'bedroom': ['卧室', '主卧', '次卧', '房间', 'bedroom'],
    'kitchen': ['厨房', 'kitchen'],
    'bathroom': ['卫生间', '洗手间', '厕所', 'bathroom', 'wc'],
    'balcony': ['阳台', 'balcony'],
    'dining': ['餐厅', 'dining'],
    'study': ['书房', '办公室', 'study', 'office'],
}

def infer_room_type(label_text):
    label_lower = label_text.lower()
    for room_type, keywords in ROOM_TYPE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in label_lower:
                return room_type
    return 'other'
```

## Error Handling

| 错误场景 | 处理方式 |
|----------|----------|
| 图片格式不支持 | 返回错误提示，列出支持的格式 |
| 图片过大 | 自动压缩或提示用户压缩 |
| 无法检测到墙体 | 提示用户上传更清晰的图片 |
| 无法识别房间 | 进入手动绘制模式 |
| OCR 识别失败 | 允许用户手动输入房间名称 |
| 比例无法确定 | 提示用户输入参考尺寸 |

## Testing Strategy

### 单元测试

- 墙体检测算法测试
- 房间轮廓检测测试
- 坐标转换测试
- JSON 生成测试

### 集成测试

- 完整识别流程测试
- 前后端 API 通信测试

### 测试数据集

准备多种类型的户型图：
- 简单矩形户型
- L 型户型
- 复杂多房间户型
- 不同风格的户型图（CAD 风格、手绘风格、彩色渲染图）

## Correctness Properties

### Property 1: 坐标转换往返一致性

*For any* 像素坐标，转换为米制坐标后再转回像素坐标，应得到原始值（允许浮点误差）

**Validates: Requirements 7.3**

### Property 2: 房间面积守恒

*For any* 识别结果，所有房间面积之和应小于等于图片总面积

**Validates: Requirements 4.3**

### Property 3: 房间不重叠

*For any* 两个识别出的房间，它们的边界矩形不应有超过阈值的重叠

**Validates: Requirements 4.1**

### Property 4: 数据格式一致性

*For any* 生成的 homeData，应能被现有的 FloorPlan 组件正确渲染

**Validates: Requirements 8.1**
