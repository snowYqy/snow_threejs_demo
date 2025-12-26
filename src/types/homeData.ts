/**
 * 户型数据驱动渲染规则 - 智能家居版
 */

/** 元数据配置 */
export interface HomeMeta {
  version: string;
  name: string;
  unit: string;
  wallHeight: number;
  wallThickness: number;
}

/** 智能设备类型 */
export type DeviceType = 
  | 'light'        // 灯具
  | 'ac'           // 空调
  | 'fan'          // 落地扇
  | 'curtain'      // 窗帘
  | 'tv'           // 电视
  | 'speaker'      // 音箱
  | 'humidifier'   // 加湿器
  | 'purifier'     // 空气净化器
  | 'heater';      // 取暖器

/** 智能设备配置 */
export interface DeviceData {
  id: string;
  type: DeviceType;
  name: string;
  offset: [number, number];  // [x, z] 相对于房间中心
  size?: [number, number];   // [width, depth] 可选
  height?: number;           // 可选高度
  rotation?: number;         // 旋转角度(度)
  isOn?: boolean;            // 开关状态
  color?: string;            // 自定义颜色
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
  position: [number, number];
  size: [number, number];
  color: string;
  devices: DeviceData[];
}

/** 墙壁开口 */
export interface WallOpening {
  type: 'door' | 'window';
  position: number;
  width: number;
  height?: number;
}

/** 墙壁配置 */
export interface WallData {
  id: string;
  from: [number, number];
  to: [number, number];
  length?: number;
  direction?: 'x' | 'z';
  openings?: WallOpening[];
}

/** 完整户型数据 */
export interface HomeData {
  meta: HomeMeta;
  rooms: RoomData[];
  walls: WallData[];
}

/** 默认设备尺寸 */
export const DEFAULT_DEVICE_SIZE: Record<DeviceType, { width: number; depth: number; height: number }> = {
  light: { width: 0.4, depth: 0.4, height: 0.1 },
  ac: { width: 1.0, depth: 0.3, height: 0.3 },
  fan: { width: 0.4, depth: 0.4, height: 1.2 },
  curtain: { width: 0.1, depth: 2.0, height: 2.5 },
  tv: { width: 1.2, depth: 0.1, height: 0.7 },
  speaker: { width: 0.15, depth: 0.15, height: 0.25 },
  humidifier: { width: 0.25, depth: 0.25, height: 0.35 },
  purifier: { width: 0.3, depth: 0.3, height: 0.6 },
  heater: { width: 0.5, depth: 0.15, height: 0.6 },
};

/** 设备颜色 */
export const DEVICE_COLORS: Record<DeviceType, { on: string; off: string }> = {
  light: { on: '#FFD700', off: '#808080' },
  ac: { on: '#00BFFF', off: '#A0A0A0' },
  fan: { on: '#87CEEB', off: '#B0B0B0' },
  curtain: { on: '#DEB887', off: '#8B7355' },
  tv: { on: '#1E90FF', off: '#2F2F2F' },
  speaker: { on: '#FF6347', off: '#4A4A4A' },
  humidifier: { on: '#00CED1', off: '#696969' },
  purifier: { on: '#98FB98', off: '#708090' },
  heater: { on: '#FF4500', off: '#5A5A5A' },
};
