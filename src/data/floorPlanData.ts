import type { FloorPlanConfig } from '../types';

/**
 * 三室两厅户型数据配置
 * 
 * 布局说明:
 * - 总面积约 16m x 12m
 * - 三个卧室: 主卧、次卧、书房/客卧
 * - 两厅: 客厅、餐厅
 * - 一厨一卫 + 阳台
 * 
 * 坐标系统:
 * - X轴: 东西方向 (正向为东)
 * - Y轴: 高度方向 (正向为上)
 * - Z轴: 南北方向 (正向为南)
 * - position表示房间中心点位置
 * - size表示 [宽度, 高度, 深度]
 */
export const floorPlanData: FloorPlanConfig = {
  totalSize: [16, 12],
  rooms: [
    // 客厅 - 位于中央偏南
    {
      id: 'living-room',
      name: '客厅',
      type: 'living',
      position: [0, 1.5, 2],
      size: [6, 3, 5],
      color: '#E8D5B7', // 温暖米色
    },
    // 餐厅 - 位于客厅北侧
    {
      id: 'dining-room',
      name: '餐厅',
      type: 'dining',
      position: [0, 1.5, -2.5],
      size: [4, 3, 3],
      color: '#F5E6D3', // 浅米色
    },
    // 主卧 - 位于东南角
    {
      id: 'master-bedroom',
      name: '主卧',
      type: 'bedroom',
      position: [5, 1.5, 2.5],
      size: [4, 3, 4],
      color: '#D4E6F1', // 浅蓝色
    },
    // 次卧 - 位于东北角
    {
      id: 'second-bedroom',
      name: '次卧',
      type: 'bedroom',
      position: [5, 1.5, -2.5],
      size: [4, 3, 3.5],
      color: '#D5F5E3', // 浅绿色
    },
    // 书房/客卧 - 位于西北角
    {
      id: 'study-room',
      name: '书房',
      type: 'bedroom',
      position: [-5, 1.5, -2.5],
      size: [3.5, 3, 3.5],
      color: '#FCF3CF', // 浅黄色
    },
    // 厨房 - 位于西侧中部
    {
      id: 'kitchen',
      name: '厨房',
      type: 'kitchen',
      position: [-5, 1.5, 1],
      size: [3.5, 3, 3],
      color: '#FADBD8', // 浅粉色
    },
    // 卫生间 - 位于北侧中部
    {
      id: 'bathroom',
      name: '卫生间',
      type: 'bathroom',
      position: [2, 1.5, -4.5],
      size: [2.5, 3, 2],
      color: '#E8DAEF', // 浅紫色
    },
    // 阳台 - 位于南侧
    {
      id: 'balcony',
      name: '阳台',
      type: 'balcony',
      position: [2, 1.5, 5.5],
      size: [5, 3, 1.5],
      color: '#ABEBC6', // 浅绿色
    },
    // 玄关/走廊 - 连接各房间
    {
      id: 'hallway',
      name: '走廊',
      type: 'hallway',
      position: [-2, 1.5, -1],
      size: [2, 3, 4],
      color: '#F8F9F9', // 浅灰白色
    },
  ],
};

/**
 * 获取房间名称映射
 * @returns 房间ID到名称的映射对象
 */
export const getRoomNames = (): Record<string, string> => {
  return floorPlanData.rooms.reduce((acc, room) => {
    acc[room.id] = room.name;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * 根据ID获取房间配置
 * @param roomId 房间ID
 * @returns 房间配置或undefined
 */
export const getRoomById = (roomId: string) => {
  return floorPlanData.rooms.find(room => room.id === roomId);
};

export default floorPlanData;
