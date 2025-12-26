import type { HomeData, RoomData, FurnitureData, WallData } from '../types/homeData';
import { DEFAULT_FURNITURE_HEIGHT } from '../types/homeData';

/**
 * 加载户型数据
 */
export async function loadHomeData(url: string = '/homeData.json'): Promise<HomeData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load home data: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 计算房间的3D位置 (添加Y轴高度)
 */
export function getRoomPosition(room: RoomData, wallHeight: number): [number, number, number] {
  return [room.position[0], wallHeight / 2, room.position[1]];
}

/**
 * 计算房间的3D尺寸 (添加高度)
 */
export function getRoomSize(room: RoomData, wallHeight: number): [number, number, number] {
  return [room.size[0], wallHeight, room.size[1]];
}

/**
 * 计算家具的3D偏移位置
 */
export function getFurnitureOffset(
  furniture: FurnitureData,
  wallHeight: number
): [number, number, number] {
  const height = furniture.height ?? DEFAULT_FURNITURE_HEIGHT[furniture.type];
  // Y轴: 从地板开始放置 (-wallHeight/2 是地板位置，+height/2 是家具中心)
  const y = -wallHeight / 2 + height / 2 + 0.05; // 0.05是地板厚度
  return [furniture.offset[0], y, furniture.offset[1]];
}

/**
 * 计算家具的3D尺寸
 */
export function getFurnitureSize(furniture: FurnitureData): [number, number, number] {
  const height = furniture.height ?? DEFAULT_FURNITURE_HEIGHT[furniture.type];
  return [furniture.size[0], height, furniture.size[1]];
}

/**
 * 计算墙壁的3D属性
 */
export function getWallGeometry(
  wall: WallData,
  wallHeight: number,
  wallThickness: number
): { position: [number, number, number]; size: [number, number, number] } {
  const [x1, z1] = wall.from;
  const [x2, z2] = wall.to;
  
  // 计算墙壁长度和方向
  let length: number;
  let isHorizontal: boolean;
  
  if (wall.length && wall.direction) {
    length = wall.length;
    isHorizontal = wall.direction === 'x';
  } else {
    const dx = x2 - x1;
    const dz = z2 - z1;
    length = Math.sqrt(dx * dx + dz * dz);
    isHorizontal = Math.abs(dx) > Math.abs(dz);
  }
  
  // 计算中心位置
  const centerX = (x1 + x2) / 2;
  const centerZ = (z1 + z2) / 2;
  
  return {
    position: [centerX, wallHeight / 2, centerZ],
    size: isHorizontal 
      ? [length, wallHeight, wallThickness]
      : [wallThickness, wallHeight, length],
  };
}

/**
 * 计算外墙边界
 */
export function calculateOuterWalls(rooms: RoomData[]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  rooms.forEach(room => {
    const [x, z] = room.position;
    const [w, d] = room.size;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minZ = Math.min(minZ, z - d / 2);
    maxZ = Math.max(maxZ, z + d / 2);
  });
  
  return { minX, maxX, minZ, maxZ };
}

/**
 * 获取房间名称映射
 */
export function getRoomNames(rooms: RoomData[]): Record<string, string> {
  return rooms.reduce((acc, room) => {
    acc[room.id] = room.name;
    return acc;
  }, {} as Record<string, string>);
}
