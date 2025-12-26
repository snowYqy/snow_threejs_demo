/**
 * 房间类型枚举
 * - bedroom: 卧室
 * - living: 客厅
 * - dining: 餐厅
 * - kitchen: 厨房
 * - bathroom: 卫生间
 * - balcony: 阳台
 * - hallway: 走廊/玄关
 */
export type RoomType = 'bedroom' | 'living' | 'dining' | 'kitchen' | 'bathroom' | 'balcony' | 'hallway';

/**
 * 门配置接口
 */
export interface DoorConfig {
  position: 'north' | 'south' | 'east' | 'west';
  offset: number;
  width: number;
}

/**
 * 窗户配置接口
 */
export interface WindowConfig {
  position: 'north' | 'south' | 'east' | 'west';
  offset: number;
  width: number;
  height: number;
}

/**
 * 房间配置接口
 */
export interface RoomConfig {
  id: string;
  name: string;
  type: RoomType;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: string;
  doors?: DoorConfig[];
  windows?: WindowConfig[];
}

/**
 * 户型布局配置接口
 */
export interface FloorPlanConfig {
  rooms: RoomConfig[];
  totalSize: [number, number]; // width, depth
}

/**
 * 应用状态接口
 */
export interface AppState {
  selectedRoom: string | null;
  hoveredRoom: string | null;
}

/**
 * Scene3D组件属性接口
 */
export interface Scene3DProps {
  onRoomSelect: (roomId: string | null) => void;
  onRoomHover: (roomId: string | null) => void;
  selectedRoom: string | null;
  hoveredRoom: string | null;
}

/**
 * FloorPlan组件属性接口
 */
export interface FloorPlanProps {
  onRoomClick: (roomId: string) => void;
  onRoomHover: (roomId: string | null) => void;
  selectedRoom: string | null;
  hoveredRoom: string | null;
}

/**
 * Room组件属性接口
 */
export interface RoomProps {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

/**
 * UI组件属性接口
 */
export interface UIProps {
  selectedRoom: string | null;
  roomNames: Record<string, string>;
}
