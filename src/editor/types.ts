// 2D Floor Plan Editor Types

// ============ 配置常量 ============
export const EDITOR_CONFIG = {
  // L1 规则阈值
  MIN_ROOM_AREA: 10000, // 最小房间面积 1㎡ = 10000 cm² (以cm为单位)
  MIN_WALL_LENGTH: 30, // 最小墙长度 30cm
  
  // L3 自动修复阈值
  SNAP_DISTANCE: 15, // 自动吸附距离 15px
  AUTO_CLOSE_THRESHOLD: 20, // 自动闭合阈值 20px
  DOOR_WINDOW_MIN_DISTANCE: 20, // 门窗距墙端点最小距离
  
  // 单位
  UNIT: 'cm' as const, // 全局单位
  PIXELS_PER_CM: 1, // 1像素 = 1cm
};

export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number;
}

export interface Room {
  id: string;
  vertexIds: string[];
  color: string;
  name: string;
  type?: RoomType; // L4-1 房间类型
  area?: number; // L2-1 房间面积
}

// L4-1 房间类型
export type RoomType = 
  | 'living_room' 
  | 'bedroom' 
  | 'bathroom' 
  | 'kitchen' 
  | 'balcony' 
  | 'storage' 
  | 'corridor'
  | 'unknown';

export interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1, relative position on wall
  width: number;
  direction: 'left' | 'right';
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
}

// L2-3 设备绑定
export interface Device {
  id: string;
  type: string;
  name: string;
  roomId?: string; // 绑定的房间
  wallId?: string; // 绑定的墙体
  position: { x: number; y: number };
}

export type ToolType = 'select' | 'drawWall' | 'delete' | 'door' | 'window';

// 错误级别
export type ErrorLevel = 'error' | 'warning' | 'info';

// 错误类型扩展
export type EditorErrorType = 
  // L1 结构可用性错误
  | 'no_closed_room'      // L1-1 无闭合房间
  | 'room_too_small'      // L1-1 房间面积过小
  | 'wall_too_short'      // L1-2 墙体过短
  | 'wall_self_intersect' // L1-2 墙体自交
  | 'wall_dead_end'       // L1-2 墙体断点
  | 'door_no_wall'        // L1-3 门无墙体
  | 'window_no_wall'      // L1-3 窗无墙体
  | 'door_too_wide'       // L1-3 门过宽
  | 'window_too_wide'     // L1-3 窗过宽
  | 'door_out_of_wall'    // L1-3 门超出墙体
  | 'window_out_of_wall'  // L1-3 窗超出墙体
  // L2 空间语义错误
  | 'room_overlap'        // L2-2 房间重叠
  | 'device_no_binding'   // L2-3 设备未绑定
  | 'device_out_of_room'  // L2-3 设备超出房间
  // 兼容旧类型
  | 'unclosed_wall'
  | 'invalid_door'
  | 'invalid_window'
  | 'self_intersect';

export interface EditorError {
  id: string;
  type: EditorErrorType;
  level: ErrorLevel;
  message: string;
  elementId: string;
  autoFixable?: boolean; // 是否可自动修复
}

// 验证结果
export interface ValidationResult {
  isValid: boolean; // L1规则全部通过
  canExport: boolean; // 可以导出到3D
  errors: EditorError[];
  warnings: EditorError[];
  roomCount: number;
  totalArea: number;
}

export interface Point {
  x: number;
  y: number;
}

// Graph structure for geometry calculations
export interface GraphNode {
  x: number;
  y: number;
  edges: string[];
}

export interface GraphEdge {
  start: string;
  end: string;
}

export interface Graph {
  vertices: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}
