/**
 * 户型数据驱动渲染规则
 * 
 * ## 坐标系统
 * - X轴: 东西方向 (正向为东)
 * - Y轴: 高度方向 (正向为上) - 由系统自动计算
 * - Z轴: 南北方向 (正向为南)
 * - position: [x, z] 表示房间中心在地面上的位置
 * - size: [width, depth] 表示房间的宽度和深度
 * 
 * ## 渲染规则
 * 1. 房间(Room): 根据position和size绘制地板，高度由meta.wallHeight决定
 * 2. 家具(Furniture): 根据offset相对于房间中心放置，高度根据type自动计算
 * 3. 墙壁(Wall): 根据from/to坐标绘制，支持门窗开口
 * 4. 外墙: 自动根据所有房间边界计算生成
 */

/** 元数据配置 */
export interface HomeMeta {
  version: string;
  name: string;
  unit: string;
  wallHeight: number;
  wallThickness: number;
}

/** 家具类型 */
export type FurnitureType = 
  | 'sofa' | 'bed' | 'table' | 'chair' | 'desk' 
  | 'cabinet' | 'toilet' | 'sink' | 'stove' | 'fridge';

/** 家具配置 */
export interface FurnitureData {
  type: FurnitureType;
  offset: [number, number];  // [x, z] 相对于房间中心
  size: [number, number];    // [width, depth]
  height?: number;           // 可选高度，默认根据type计算
  rotation?: number;         // 旋转角度(度)
  color: string;
}

/** 房间类型 */
export type RoomType = 
  | 'living' | 'dining' | 'kitchen' | 'bedroom' 
  | 'bathroom' | 'balcony' | 'study' | 'hallway';

/** 房间配置 */
export interface RoomData {
  id: string;
  name: string;
  type: RoomType;
  position: [number, number];  // [x, z] 房间中心位置
  size: [number, number];      // [width, depth]
  color: string;
  furniture: FurnitureData[];
}

/** 开口类型(门/窗) */
export interface WallOpening {
  type: 'door' | 'window';
  position: number;  // 0-1, 在墙上的相对位置
  width: number;
  height?: number;   // 窗户高度
}

/** 墙壁配置 */
export interface WallData {
  id: string;
  from: [number, number];      // 起点 [x, z]
  to: [number, number];        // 终点 [x, z]
  length?: number;             // 可选长度(用于单点+方向定义)
  direction?: 'x' | 'z';       // 方向
  openings?: WallOpening[];    // 门窗开口
}

/** 完整户型数据 */
export interface HomeData {
  meta: HomeMeta;
  rooms: RoomData[];
  walls: WallData[];
}

/** 默认家具高度映射 */
export const DEFAULT_FURNITURE_HEIGHT: Record<FurnitureType, number> = {
  sofa: 0.8,
  bed: 0.7,
  table: 0.75,
  chair: 0.9,
  desk: 0.75,
  cabinet: 1.2,
  toilet: 0.6,
  sink: 0.85,
  stove: 0.9,
  fridge: 1.8,
};
