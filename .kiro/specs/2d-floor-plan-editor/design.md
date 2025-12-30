# Design Document

## Overview

2D 户型编辑器采用分层架构设计，将数据模型、工具系统、规则引擎、几何计算和 Konva 渲染层完全分离。使用 React + Konva (react-konva) + Zustand 技术栈实现。

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Toolbar    │  │  Canvas     │  │  ErrorPanel │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│                    Konva View Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Stage                                            │   │
│  │  ├─ GridLayer                                    │   │
│  │  ├─ RoomLayer (封闭区域填色)                      │   │
│  │  ├─ WallLayer                                    │   │
│  │  ├─ DoorWindowLayer                              │   │
│  │  └─ InteractionLayer                             │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Tool System                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Select   │ │ DrawWall │ │ Door     │ │ Delete   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Rule Engine                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ validateWalls() │ validateRooms() │ validateDoors()│ │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Geometry Engine                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ findCycles() │ polygonArea() │ pointInPolygon() │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Data Model (Zustand Store)            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ vertices │ walls │ rooms │ doors │ windows │ errors│ │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Data Model Types

```typescript
// src/editor/types.ts

interface Vertex {
  id: string;
  x: number;
  y: number;
}

interface Wall {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number;
}

interface Room {
  id: string;
  vertexIds: string[];  // 顺时针或逆时针排列的顶点
  color: string;
  name: string;
}

interface Door {
  id: string;
  wallId: string;
  position: number;  // 0-1, 在墙上的相对位置
  width: number;
  direction: 'left' | 'right';  // 开门方向
}

interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
}

type ToolType = 'select' | 'drawWall' | 'delete' | 'door' | 'window';

interface EditorError {
  id: string;
  type: 'unclosed_wall' | 'invalid_door' | 'invalid_window' | 'self_intersect';
  message: string;
  elementId: string;
}
```

### 2. Editor Store Interface

```typescript
// src/editor/store/useEditorStore.ts

interface EditorState {
  // Data
  vertices: Map<string, Vertex>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  doors: Map<string, Door>;
  windows: Map<string, Window>;
  
  // UI State
  activeTool: ToolType;
  selectedIds: string[];
  hoveredId: string | null;
  errors: EditorError[];
  
  // Drawing State
  drawingVertexId: string | null;  // 正在绘制墙体时的起点
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  addVertex: (x: number, y: number) => string;
  addWall: (startId: string, endId: string) => string;
  deleteWall: (id: string) => void;
  addDoor: (wallId: string, position: number) => void;
  addWindow: (wallId: string, position: number) => void;
  moveVertex: (id: string, x: number, y: number) => void;
  
  // Computed
  recalculateRooms: () => void;
  validateAll: () => void;
}
```

### 3. Geometry Engine Interface

```typescript
// src/editor/engine/geometry.ts

interface Graph {
  vertices: Map<string, { x: number; y: number; edges: string[] }>;
  edges: Map<string, { start: string; end: string }>;
}

// 将墙体数据转换为图结构
function buildGraph(vertices: Map<string, Vertex>, walls: Map<string, Wall>): Graph;

// 查找所有闭合环（房间）
function findAllCycles(graph: Graph): string[][];

// 计算多边形面积
function calculatePolygonArea(points: { x: number; y: number }[]): number;

// 判断点是否在多边形内
function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean;

// 查找最近的顶点（用于吸附）
function findNearestVertex(
  point: { x: number; y: number },
  vertices: Map<string, Vertex>,
  snapDistance: number
): string | null;

// 检测线段是否相交
function doLinesIntersect(
  line1: { start: { x: number; y: number }; end: { x: number; y: number } },
  line2: { start: { x: number; y: number }; end: { x: number; y: number } }
): boolean;
```

### 4. Rule Engine Interface

```typescript
// src/editor/engine/rules.ts

interface ValidationResult {
  valid: boolean;
  errors: EditorError[];
}

// 校验所有墙体
function validateWalls(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>
): ValidationResult;

// 校验所有房间
function validateRooms(rooms: Map<string, Room>): ValidationResult;

// 校验门窗
function validateDoorsAndWindows(
  doors: Map<string, Door>,
  windows: Map<string, Window>,
  walls: Map<string, Wall>,
  vertices: Map<string, Vertex>
): ValidationResult;
```

### 5. Tool System Interface

```typescript
// src/editor/tools/types.ts

interface ToolContext {
  store: EditorState;
  stage: Konva.Stage;
}

interface Tool {
  name: ToolType;
  cursor: string;
  
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>, ctx: ToolContext) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>, ctx: ToolContext) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>, ctx: ToolContext) => void;
  onKeyDown?: (e: KeyboardEvent, ctx: ToolContext) => void;
}
```

## Data Models

### Vertex-Wall-Room 关系

```
Vertex ←──────── Wall ────────→ Vertex
   │                               │
   └───────────────────────────────┘
                 │
                 ▼
              Room (由多个 Vertex 围成)
```

### 状态流转

```
User Action → Tool Handler → Store Update → Geometry Recalc → Rule Validation → View Update
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Vertex Reference Integrity
*For any* wall in the store, both startVertexId and endVertexId must reference existing vertices in the vertices map.
**Validates: Requirements 1.1, 1.2**

### Property 2: Room Closure
*For any* room in the store, the vertexIds must form a closed polygon where consecutive vertices are connected by walls.
**Validates: Requirements 4.1, 4.2**

### Property 3: Door Wall Attachment
*For any* door in the store, the wallId must reference an existing wall, and position must be between 0 and 1.
**Validates: Requirements 6.1, 6.4**

### Property 4: Snap Distance Consistency
*For any* vertex created near an existing vertex (within snap distance), the new vertex should be merged with the existing one.
**Validates: Requirements 3.3**

### Property 5: Error State Consistency
*For any* wall not part of a closed cycle, it must appear in the errors list with type 'unclosed_wall'.
**Validates: Requirements 4.3, 7.1**

## Error Handling

### Error Types and Recovery

| Error Type | Detection | Visual Feedback | Recovery |
|------------|-----------|-----------------|----------|
| unclosed_wall | Geometry Engine | Red wall color | Connect to other walls |
| invalid_door | Rule Engine | Red door + tooltip | Move or resize door |
| invalid_window | Rule Engine | Red window + tooltip | Move or resize window |
| self_intersect | Geometry Engine | Red intersection point | Delete or move wall |

## Testing Strategy

### Unit Tests
- Geometry functions (findCycles, calculateArea, pointInPolygon)
- Rule validation functions
- Store actions

### Property-Based Tests
- Vertex reference integrity after any operation
- Room closure property after wall operations
- Door/window attachment after wall deletion

### Integration Tests
- Complete drawing workflow
- Tool switching behavior
- Error display and recovery
