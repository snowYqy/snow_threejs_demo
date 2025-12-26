import type { FloorPlanConfig } from '../types';

/**
 * 三室两厅户型数据配置
 * 
 * 布局说明 (紧凑型，房间共用墙壁):
 * - 总面积约 12m x 10m
 * - 房间紧密相连，共用墙壁
 * 
 * 坐标系统:
 * - X轴: 东西方向 (正向为东)
 * - Y轴: 高度方向 (正向为上)
 * - Z轴: 南北方向 (正向为南)
 */
export const floorPlanData: FloorPlanConfig = {
  totalSize: [12, 10],
  rooms: [
    // 客厅 - 中央位置 (6x5)
    {
      id: 'living-room',
      name: '客厅',
      type: 'living',
      position: [0, 1.5, 0],
      size: [6, 3, 5],
      color: '#F5E6D3',
    },
    // 餐厅 - 客厅西侧 (3x5)
    {
      id: 'dining-room',
      name: '餐厅',
      type: 'dining',
      position: [-4.5, 1.5, 0],
      size: [3, 3, 5],
      color: '#E8D5B7',
    },
    // 厨房 - 餐厅北侧 (3x3)
    {
      id: 'kitchen',
      name: '厨房',
      type: 'kitchen',
      position: [-4.5, 1.5, -4],
      size: [3, 3, 3],
      color: '#FADBD8',
    },
    // 主卧 - 东南角 (4x4)
    {
      id: 'master-bedroom',
      name: '主卧',
      type: 'bedroom',
      position: [5, 1.5, 2.5],
      size: [4, 3, 4],
      color: '#D4E6F1',
    },
    // 次卧 - 东北角 (4x3.5)
    {
      id: 'second-bedroom',
      name: '次卧',
      type: 'bedroom',
      position: [5, 1.5, -1.75],
      size: [4, 3, 3.5],
      color: '#D5F5E3',
    },
    // 书房 - 西北角 (3x2.5)
    {
      id: 'study-room',
      name: '书房',
      type: 'bedroom',
      position: [-4.5, 1.5, -6.75],
      size: [3, 3, 2.5],
      color: '#FCF3CF',
    },
    // 卫生间 - 北侧中部 (2.5x2.5)
    {
      id: 'bathroom',
      name: '卫生间',
      type: 'bathroom',
      position: [0, 1.5, -3.75],
      size: [2.5, 3, 2.5],
      color: '#E8DAEF',
    },
    // 阳台 - 南侧 (6x1.5)
    {
      id: 'balcony',
      name: '阳台',
      type: 'balcony',
      position: [0, 1.5, 4],
      size: [6, 3, 1.5],
      color: '#ABEBC6',
    },
  ],
};

/**
 * 家具配置
 */
export interface FurnitureConfig {
  id: string;
  roomId: string;
  type: 'sofa' | 'bed' | 'table' | 'chair' | 'desk' | 'cabinet' | 'toilet' | 'sink' | 'stove' | 'fridge';
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
  color: string;
}

export const furnitureData: FurnitureConfig[] = [
  // 客厅家具
  { id: 'sofa-1', roomId: 'living-room', type: 'sofa', position: [0, 0.4, 1.5], size: [2.5, 0.8, 1], color: '#8B4513' },
  { id: 'tv-cabinet', roomId: 'living-room', type: 'cabinet', position: [0, 0.3, -2], size: [2, 0.6, 0.4], color: '#5D4037' },
  { id: 'coffee-table', roomId: 'living-room', type: 'table', position: [0, 0.25, 0.3], size: [1.2, 0.5, 0.6], color: '#795548' },
  
  // 餐厅家具
  { id: 'dining-table', roomId: 'dining-room', type: 'table', position: [-4.5, 0.4, 0], size: [1.5, 0.8, 1], color: '#6D4C41' },
  { id: 'chair-1', roomId: 'dining-room', type: 'chair', position: [-4.5, 0.25, 0.8], size: [0.4, 0.5, 0.4], color: '#8D6E63' },
  { id: 'chair-2', roomId: 'dining-room', type: 'chair', position: [-4.5, 0.25, -0.8], size: [0.4, 0.5, 0.4], color: '#8D6E63' },
  
  // 厨房家具
  { id: 'stove', roomId: 'kitchen', type: 'stove', position: [-4.5, 0.45, -4.8], size: [0.8, 0.9, 0.6], color: '#37474F' },
  { id: 'fridge', roomId: 'kitchen', type: 'fridge', position: [-5.5, 0.9, -3.5], size: [0.7, 1.8, 0.7], color: '#ECEFF1' },
  { id: 'sink', roomId: 'kitchen', type: 'sink', position: [-3.5, 0.45, -4.8], size: [0.6, 0.9, 0.5], color: '#B0BEC5' },
  
  // 主卧家具
  { id: 'master-bed', roomId: 'master-bedroom', type: 'bed', position: [5, 0.35, 3], size: [2, 0.7, 2.2], color: '#BBDEFB' },
  { id: 'wardrobe-1', roomId: 'master-bedroom', type: 'cabinet', position: [6.5, 1, 1], size: [0.6, 2, 1.5], color: '#5D4037' },
  
  // 次卧家具
  { id: 'second-bed', roomId: 'second-bedroom', type: 'bed', position: [5, 0.35, -1.5], size: [1.5, 0.7, 2], color: '#C8E6C9' },
  { id: 'wardrobe-2', roomId: 'second-bedroom', type: 'cabinet', position: [6.5, 1, -2.5], size: [0.6, 2, 1.2], color: '#5D4037' },
  
  // 书房家具
  { id: 'desk', roomId: 'study-room', type: 'desk', position: [-4.5, 0.4, -7.2], size: [1.2, 0.8, 0.6], color: '#6D4C41' },
  { id: 'desk-chair', roomId: 'study-room', type: 'chair', position: [-4.5, 0.3, -6.5], size: [0.5, 0.6, 0.5], color: '#424242' },
  { id: 'bookshelf', roomId: 'study-room', type: 'cabinet', position: [-5.5, 1, -6.5], size: [0.4, 2, 1.5], color: '#5D4037' },
  
  // 卫生间家具
  { id: 'toilet', roomId: 'bathroom', type: 'toilet', position: [0.5, 0.3, -4.5], size: [0.5, 0.6, 0.7], color: '#FAFAFA' },
  { id: 'bathroom-sink', roomId: 'bathroom', type: 'sink', position: [-0.5, 0.45, -4.5], size: [0.6, 0.9, 0.5], color: '#FAFAFA' },
];

/**
 * 获取房间名称映射
 */
export const getRoomNames = (): Record<string, string> => {
  return floorPlanData.rooms.reduce((acc, room) => {
    acc[room.id] = room.name;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * 根据ID获取房间配置
 */
export const getRoomById = (roomId: string) => {
  return floorPlanData.rooms.find(room => room.id === roomId);
};

/**
 * 获取房间内的家具
 */
export const getFurnitureByRoom = (roomId: string) => {
  return furnitureData.filter(f => f.roomId === roomId);
};

export default floorPlanData;
