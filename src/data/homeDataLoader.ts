import type { HomeData, RoomData, DeviceData, WallData } from '../types/homeData';
import { DEFAULT_DEVICE_SIZE } from '../types/homeData';

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
 * 计算房间的3D位置
 */
export function getRoomPosition(room: RoomData, wallHeight: number): [number, number, number] {
  return [room.position[0], wallHeight / 2, room.position[1]];
}

/**
 * 计算房间的3D尺寸
 */
export function getRoomSize(room: RoomData, wallHeight: number): [number, number, number] {
  return [room.size[0], wallHeight, room.size[1]];
}

/**
 * 计算设备的3D偏移位置
 */
export function getDeviceOffset(
  device: DeviceData,
  wallHeight: number
): [number, number, number] {
  const defaults = DEFAULT_DEVICE_SIZE[device.type];
  const height = device.height ?? defaults.height;
  
  // 特殊处理：灯具和空调挂在天花板
  if (device.type === 'light') {
    return [device.offset[0], wallHeight / 2 - 0.1, device.offset[1]];
  }
  if (device.type === 'ac') {
    return [device.offset[0], wallHeight / 2 - 0.3, device.offset[1]];
  }
  if (device.type === 'curtain') {
    return [device.offset[0], 0, device.offset[1]];
  }
  if (device.type === 'tv') {
    return [device.offset[0], -wallHeight / 2 + 1.2, device.offset[1]];
  }
  
  // 其他设备放在地面
  const y = -wallHeight / 2 + height / 2 + 0.05;
  return [device.offset[0], y, device.offset[1]];
}

/**
 * 计算设备的3D尺寸
 */
export function getDeviceSize(device: DeviceData): [number, number, number] {
  const defaults = DEFAULT_DEVICE_SIZE[device.type];
  const width = device.size?.[0] ?? defaults.width;
  const depth = device.size?.[1] ?? defaults.depth;
  const height = device.height ?? defaults.height;
  return [width, height, depth];
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

/**
 * 获取所有设备列表
 */
export function getAllDevices(rooms: RoomData[]): Array<DeviceData & { roomId: string; roomName: string }> {
  const devices: Array<DeviceData & { roomId: string; roomName: string }> = [];
  rooms.forEach(room => {
    room.devices.forEach(device => {
      devices.push({ ...device, roomId: room.id, roomName: room.name });
    });
  });
  return devices;
}
