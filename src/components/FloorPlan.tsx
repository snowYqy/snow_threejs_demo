import { useMemo } from 'react';
import { Room } from './Room';
import { useHomeStore } from '../store/useHomeStore';
import type { RoomData } from '../types/homeData';

// 墙壁样式
const WALL_COLOR = '#B8D4E8';
const WALL_OPACITY = 0.5;
const WALL_THICKNESS = 0.1;
const DOOR_WIDTH = 0.9;
const DOOR_HEIGHT = 2.2;

interface WallDef {
  id: string;
  start: [number, number];
  end: [number, number];
  hasDoor?: boolean;
}

/**
 * 根据房间布局生成所有墙壁
 */
function generateWalls(rooms: RoomData[]): WallDef[] {
  const walls: WallDef[] = [];
  
  // 计算整体边界
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  rooms.forEach(room => {
    const [x, z] = room.position;
    const [w, d] = room.size;
    minX = Math.min(minX, x - w/2);
    maxX = Math.max(maxX, x + w/2);
    minZ = Math.min(minZ, z - d/2);
    maxZ = Math.max(maxZ, z + d/2);
  });

  // 用网格标记哪些位置有房间
  const gridSize = 0.5;
  const grid: Map<string, string> = new Map();
  
  rooms.forEach(room => {
    const [cx, cz] = room.position;
    const [w, d] = room.size;
    for (let x = cx - w/2 + gridSize/2; x < cx + w/2; x += gridSize) {
      for (let z = cz - d/2 + gridSize/2; z < cz + d/2; z += gridSize) {
        grid.set(`${Math.round(x*10)},${Math.round(z*10)}`, room.id);
      }
    }
  });

  // 为每个房间生成墙壁
  rooms.forEach(room => {
    const [cx, cz] = room.position;
    const [w, d] = room.size;
    const left = cx - w/2;
    const right = cx + w/2;
    const top = cz - d/2;
    const bottom = cz + d/2;

    // 检查四边是否需要墙
    // 北墙 (top)
    let needNorthWall = true;
    for (let x = left + gridSize/2; x < right; x += gridSize) {
      const neighborId = grid.get(`${Math.round(x*10)},${Math.round((top - gridSize)*10)}`);
      if (neighborId && neighborId !== room.id) {
        needNorthWall = false;
        break;
      }
    }
    if (needNorthWall || Math.abs(top - minZ) < 0.1) {
      walls.push({
        id: `${room.id}-north`,
        start: [left, top],
        end: [right, top],
        hasDoor: room.type === 'balcony'
      });
    }

    // 南墙 (bottom)
    let needSouthWall = true;
    for (let x = left + gridSize/2; x < right; x += gridSize) {
      const neighborId = grid.get(`${Math.round(x*10)},${Math.round((bottom + gridSize)*10)}`);
      if (neighborId && neighborId !== room.id) {
        needSouthWall = false;
        break;
      }
    }
    if (needSouthWall || Math.abs(bottom - maxZ) < 0.1) {
      walls.push({
        id: `${room.id}-south`,
        start: [left, bottom],
        end: [right, bottom],
        hasDoor: Math.abs(bottom - maxZ) < 0.1 && room.type === 'balcony'
      });
    }

    // 西墙 (left)
    let needWestWall = true;
    for (let z = top + gridSize/2; z < bottom; z += gridSize) {
      const neighborId = grid.get(`${Math.round((left - gridSize)*10)},${Math.round(z*10)}`);
      if (neighborId && neighborId !== room.id) {
        needWestWall = false;
        break;
      }
    }
    if (needWestWall || Math.abs(left - minX) < 0.1) {
      walls.push({
        id: `${room.id}-west`,
        start: [left, top],
        end: [left, bottom],
        hasDoor: false
      });
    }

    // 东墙 (right)
    let needEastWall = true;
    for (let z = top + gridSize/2; z < bottom; z += gridSize) {
      const neighborId = grid.get(`${Math.round((right + gridSize)*10)},${Math.round(z*10)}`);
      if (neighborId && neighborId !== room.id) {
        needEastWall = false;
        break;
      }
    }
    if (needEastWall || Math.abs(right - maxX) < 0.1) {
      walls.push({
        id: `${room.id}-east`,
        start: [right, top],
        end: [right, bottom],
        hasDoor: false
      });
    }
  });

  // 添加房间之间的隔墙（带门）
  const addedInnerWalls = new Set<string>();
  rooms.forEach(room1 => {
    rooms.forEach(room2 => {
      if (room1.id >= room2.id) return;
      
      const [x1, z1] = room1.position;
      const [w1, d1] = room1.size;
      const [x2, z2] = room2.position;
      const [w2, d2] = room2.size;

      // 检查水平相邻
      if (Math.abs((x1 + w1/2) - (x2 - w2/2)) < 0.2) {
        const wallX = x1 + w1/2;
        const zStart = Math.max(z1 - d1/2, z2 - d2/2);
        const zEnd = Math.min(z1 + d1/2, z2 + d2/2);
        if (zEnd > zStart) {
          const key = `v-${wallX.toFixed(1)}-${zStart.toFixed(1)}-${zEnd.toFixed(1)}`;
          if (!addedInnerWalls.has(key)) {
            addedInnerWalls.add(key);
            walls.push({
              id: `inner-${room1.id}-${room2.id}`,
              start: [wallX, zStart],
              end: [wallX, zEnd],
              hasDoor: true
            });
          }
        }
      }

      // 检查垂直相邻
      if (Math.abs((z1 + d1/2) - (z2 - d2/2)) < 0.2) {
        const wallZ = z1 + d1/2;
        const xStart = Math.max(x1 - w1/2, x2 - w2/2);
        const xEnd = Math.min(x1 + w1/2, x2 + w2/2);
        if (xEnd > xStart) {
          const key = `h-${wallZ.toFixed(1)}-${xStart.toFixed(1)}-${xEnd.toFixed(1)}`;
          if (!addedInnerWalls.has(key)) {
            addedInnerWalls.add(key);
            walls.push({
              id: `inner-${room1.id}-${room2.id}-h`,
              start: [xStart, wallZ],
              end: [xEnd, wallZ],
              hasDoor: true
            });
          }
        }
      }
    });
  });

  // 去重
  const uniqueWalls: WallDef[] = [];
  const seen = new Set<string>();
  walls.forEach(wall => {
    const key = `${wall.start[0].toFixed(2)},${wall.start[1].toFixed(2)}-${wall.end[0].toFixed(2)},${wall.end[1].toFixed(2)}`;
    const keyReverse = `${wall.end[0].toFixed(2)},${wall.end[1].toFixed(2)}-${wall.start[0].toFixed(2)},${wall.start[1].toFixed(2)}`;
    if (!seen.has(key) && !seen.has(keyReverse)) {
      seen.add(key);
      uniqueWalls.push(wall);
    }
  });

  return uniqueWalls;
}

/**
 * 墙壁组件
 */
const Wall: React.FC<{ wall: WallDef; wallHeight: number }> = ({ wall, wallHeight }) => {
  const { start, end, hasDoor } = wall;
  const isVertical = Math.abs(start[0] - end[0]) < 0.01;
  const length = isVertical 
    ? Math.abs(end[1] - start[1]) 
    : Math.abs(end[0] - start[0]);
  const centerX = (start[0] + end[0]) / 2;
  const centerZ = (start[1] + end[1]) / 2;

  if (length < 0.1) return null;

  // 带门的墙
  if (hasDoor && length > DOOR_WIDTH + 0.3) {
    const sideLen = (length - DOOR_WIDTH) / 2;
    const topH = wallHeight - DOOR_HEIGHT;

    if (isVertical) {
      return (
        <group position={[centerX, wallHeight / 2, centerZ]}>
          <mesh position={[0, 0, -(length/2 - sideLen/2)]}>
            <boxGeometry args={[WALL_THICKNESS, wallHeight, sideLen]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          <mesh position={[0, 0, (length/2 - sideLen/2)]}>
            <boxGeometry args={[WALL_THICKNESS, wallHeight, sideLen]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          <mesh position={[0, (wallHeight - topH) / 2, 0]}>
            <boxGeometry args={[WALL_THICKNESS, topH, DOOR_WIDTH]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
        </group>
      );
    } else {
      return (
        <group position={[centerX, wallHeight / 2, centerZ]}>
          <mesh position={[-(length/2 - sideLen/2), 0, 0]}>
            <boxGeometry args={[sideLen, wallHeight, WALL_THICKNESS]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          <mesh position={[(length/2 - sideLen/2), 0, 0]}>
            <boxGeometry args={[sideLen, wallHeight, WALL_THICKNESS]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          <mesh position={[0, (wallHeight - topH) / 2, 0]}>
            <boxGeometry args={[DOOR_WIDTH, topH, WALL_THICKNESS]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
        </group>
      );
    }
  }

  // 实心墙
  return (
    <mesh position={[centerX, wallHeight / 2, centerZ]}>
      <boxGeometry args={isVertical ? [WALL_THICKNESS, wallHeight, length] : [length, wallHeight, WALL_THICKNESS]} />
      <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
    </mesh>
  );
};

/**
 * FloorPlan组件
 */
export const FloorPlan: React.FC = () => {
  const homeData = useHomeStore((state) => state.homeData);
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const hoveredRoom = useHomeStore((state) => state.hoveredRoom);
  const toggleRoom = useHomeStore((state) => state.toggleRoom);
  const hoverRoom = useHomeStore((state) => state.hoverRoom);

  const { meta, rooms } = homeData!;
  const { wallHeight } = meta;

  const walls = useMemo(() => generateWalls(rooms), [rooms]);

  // 计算地基
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    rooms.forEach(room => {
      const [x, z] = room.position;
      const [w, d] = room.size;
      minX = Math.min(minX, x - w/2);
      maxX = Math.max(maxX, x + w/2);
      minZ = Math.min(minZ, z - d/2);
      maxZ = Math.max(maxZ, z + d/2);
    });
    return { minX, maxX, minZ, maxZ };
  }, [rooms]);

  const { minX, maxX, minZ, maxZ } = bounds;

  return (
    <group>
      {/* 房间 */}
      {rooms.map((room) => (
        <Room
          key={room.id}
          data={room}
          wallHeight={wallHeight}
          isSelected={selectedRoom === room.id}
          isHovered={hoveredRoom === room.id}
          onClick={() => toggleRoom(room.id)}
          onHover={(hovered) => hoverRoom(hovered ? room.id : null)}
        />
      ))}

      {/* 墙壁 */}
      {walls.map((wall) => (
        <Wall key={wall.id} wall={wall} wallHeight={wallHeight} />
      ))}

      {/* 地基 */}
      <mesh position={[(minX + maxX) / 2, -0.1, (minZ + maxZ) / 2]} receiveShadow>
        <boxGeometry args={[maxX - minX + 0.5, 0.15, maxZ - minZ + 0.5]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
};

export default FloorPlan;
