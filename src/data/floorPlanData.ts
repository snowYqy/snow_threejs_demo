import type { FloorPlanConfig } from '../types';

/**
 * 三室两厅户型数据配置
 * 房间紧密相连，共用墙壁
 */
export const floorPlanData: FloorPlanConfig = {
  totalSize: [12, 10],
  rooms: [
    // 客厅 - 中央位置
    {
      id: 'living-room',
      name: '客厅',
      type: 'living',
      position: [0, 1.5, 0],
      size: [6, 3, 5],
      color: '#F5E6D3',
    },
    // 餐厅 - 客厅西侧
    {
      id: 'dining-room',
      name: '餐厅',
      type: 'dining',
      position: [-4.5, 1.5, 0],
      size: [3, 3, 5],
      color: '#E8D5B7',
    },
    // 厨房 - 餐厅北侧
    {
      id: 'kitchen',
      name: '厨房',
      type: 'kitchen',
      position: [-4.5, 1.5, -4],
      size: [3, 3, 3],
      color: '#FADBD8',
    },
    // 主卧 - 东南角
    {
      id: 'master-bedroom',
      name: '主卧',
      type: 'bedroom',
      position: [5, 1.5, 2.5],
      size: [4, 3, 4],
      color: '#D4E6F1',
    },
    // 次卧 - 东北角
    {
      id: 'second-bedroom',
      name: '次卧',
      type: 'bedroom',
      position: [5, 1.5, -1.75],
      size: [4, 3, 3.5],
      color: '#D5F5E3',
    },
    // 书房 - 西北角
    {
      id: 'study-room',
      name: '书房',
      type: 'bedroom',
      position: [-4.5, 1.5, -6.75],
      size: [3, 3, 2.5],
      color: '#FCF3CF',
    },
    // 卫生间 - 北侧中部
    {
      id: 'bathroom',
      name: '卫生间',
      type: 'bathroom',
      position: [0, 1.5, -3.75],
      size: [2.5, 3, 2.5],
      color: '#E8DAEF',
    },
    // 阳台 - 南侧
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
 * 家具配置 - 位置相对于房间中心
 */
export interface FurnitureConfig {
  id: string;
  roomId: string;
  type: 'sofa' | 'bed' | 'table' | 'chair' | 'desk' | 'cabinet' | 'toilet' | 'sink' | 'stove' | 'fridge';
  offset: [number, number, number]; // 相对于房间中心的偏移
  size: [number, number, number];
  rotation?: number;
  color: string;
}

export const furnitureData: FurnitureConfig[] = [
  // 客厅家具 (房间中心: [0, 1.5, 0], 尺寸: 6x5)
  { id: 'sofa-1', roomId: 'living-room', type: 'sofa', offset: [0, -1.1, 1.5], size: [2.5, 0.8, 1], color: '#8B4513' },
  { id: 'tv-cabinet', roomId: 'living-room', type: 'cabinet', offset: [0, -1.2, -2], size: [2, 0.6, 0.4], color: '#5D4037' },
  { id: 'coffee-table', roomId: 'living-room', type: 'table', offset: [0, -1.25, 0.3], size: [1.2, 0.5, 0.6], color: '#795548' },
  
  // 餐厅家具 (房间中心: [-4.5, 1.5, 0], 尺寸: 3x5)
  { id: 'dining-table', roomId: 'dining-room', type: 'table', offset: [0, -1.1, 0], size: [1.5, 0.8, 1], color: '#6D4C41' },
  { id: 'chair-1', roomId: 'dining-room', type: 'chair', offset: [0, -1.25, 0.8], size: [0.4, 0.5, 0.4], color: '#8D6E63' },
  { id: 'chair-2', roomId: 'dining-room', type: 'chair', offset: [0, -1.25, -0.8], size: [0.4, 0.5, 0.4], color: '#8D6E63' },
  
  // 厨房家具 (房间中心: [-4.5, 1.5, -4], 尺寸: 3x3)
  { id: 'stove', roomId: 'kitchen', type: 'stove', offset: [0, -1.05, -1], size: [0.8, 0.9, 0.6], color: '#37474F' },
  { id: 'fridge', roomId: 'kitchen', type: 'fridge', offset: [-1, -0.6, 0.5], size: [0.7, 1.8, 0.7], color: '#ECEFF1' },
  { id: 'sink', roomId: 'kitchen', type: 'sink', offset: [1, -1.05, -1], size: [0.6, 0.9, 0.5], color: '#B0BEC5' },
  
  // 主卧家具 (房间中心: [5, 1.5, 2.5], 尺寸: 4x4)
  { id: 'master-bed', roomId: 'master-bedroom', type: 'bed', offset: [0, -1.15, 0.5], size: [2, 0.7, 2.2], color: '#BBDEFB' },
  { id: 'wardrobe-1', roomId: 'master-bedroom', type: 'cabinet', offset: [1.5, -0.5, -1.5], size: [0.6, 2, 1.5], color: '#5D4037' },
  
  // 次卧家具 (房间中心: [5, 1.5, -1.75], 尺寸: 4x3.5)
  { id: 'second-bed', roomId: 'second-bedroom', type: 'bed', offset: [0, -1.15, 0], size: [1.5, 0.7, 2], color: '#C8E6C9' },
  { id: 'wardrobe-2', roomId: 'second-bedroom', type: 'cabinet', offset: [1.5, -0.5, -1], size: [0.6, 2, 1.2], color: '#5D4037' },
  
  // 书房家具 (房间中心: [-4.5, 1.5, -6.75], 尺寸: 3x2.5)
  { id: 'desk', roomId: 'study-room', type: 'desk', offset: [0, -1.1, -0.7], size: [1.2, 0.8, 0.6], color: '#6D4C41' },
  { id: 'desk-chair', roomId: 'study-room', type: 'chair', offset: [0, -1.2, 0], size: [0.5, 0.6, 0.5], color: '#424242' },
  { id: 'bookshelf', roomId: 'study-room', type: 'cabinet', offset: [-1, -0.5, 0], size: [0.4, 2, 1.5], color: '#5D4037' },
  
  // 卫生间家具 (房间中心: [0, 1.5, -3.75], 尺寸: 2.5x2.5)
  { id: 'toilet', roomId: 'bathroom', type: 'toilet', offset: [0.5, -1.2, -0.8], size: [0.5, 0.6, 0.7], color: '#FAFAFA' },
  { id: 'bathroom-sink', roomId: 'bathroom', type: 'sink', offset: [-0.5, -1.05, -0.8], size: [0.6, 0.9, 0.5], color: '#FAFAFA' },
];

/**
 * 内墙配置 - 房间之间的隔墙
 */
export interface WallConfig {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
}

export const innerWalls: WallConfig[] = [
  // 客厅与餐厅之间的墙 (部分开放)
  { id: 'wall-living-dining-1', position: [-3, 1.5, -1.5], size: [0.1, 3, 2] },
  { id: 'wall-living-dining-2', position: [-3, 1.5, 1.5], size: [0.1, 3, 2] },
  
  // 客厅与主卧之间的墙
  { id: 'wall-living-master', position: [3, 1.5, 1.5], size: [0.1, 3, 3] },
  
  // 客厅与次卧之间的墙
  { id: 'wall-living-second', position: [3, 1.5, -1.5], size: [0.1, 3, 2] },
  
  // 客厅与卫生间之间的墙
  { id: 'wall-living-bath', position: [0, 1.5, -2.5], size: [2.5, 3, 0.1] },
  
  // 客厅与阳台之间的墙 (部分玻璃)
  { id: 'wall-living-balcony-1', position: [-2.5, 1.5, 3.25], size: [1, 3, 0.1] },
  { id: 'wall-living-balcony-2', position: [2.5, 1.5, 3.25], size: [1, 3, 0.1] },
  
  // 餐厅与厨房之间的墙 (部分开放)
  { id: 'wall-dining-kitchen', position: [-4.5, 1.5, -2.5], size: [3, 3, 0.1] },
  
  // 厨房与书房之间的墙
  { id: 'wall-kitchen-study', position: [-4.5, 1.5, -5.5], size: [3, 3, 0.1] },
  
  // 主卧与次卧之间的墙
  { id: 'wall-master-second', position: [5, 1.5, 0.5], size: [4, 3, 0.1] },
  
  // 卫生间与次卧之间的墙
  { id: 'wall-bath-second', position: [1.25, 1.5, -3], size: [0.1, 3, 1.5] },
  
  // 卫生间与厨房之间的墙
  { id: 'wall-bath-kitchen', position: [-1.25, 1.5, -4], size: [0.1, 3, 2] },
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
