import { useMemo } from 'react';
import { Room } from './Room';
import { useHomeStore } from '../store/useHomeStore';
import { calculateOuterWalls } from '../data/homeDataLoader';
import type { RoomData } from '../types/homeData';

// 墙壁样式
const WALL_COLOR = '#B8D4E8';
const WALL_OPACITY = 0.4;
const WALL_THICKNESS = 0.1;
const DOOR_WIDTH = 0.9;
const DOOR_HEIGHT = 2.2;

interface WallSegment {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  hasDoor?: boolean;
}

/**
 * 计算户型的所有墙壁段
 */
function calculateWalls(rooms: RoomData[]): WallSegment[] {
  const walls: WallSegment[] = [];
  const bounds = calculateOuterWalls(rooms);
  const { minX, maxX, minZ, maxZ } = bounds;
  
  // 外墙（带门的入口在南墙中间）
  // 北墙
  walls.push({ id: 'outer-north', x1: minX, z1: minZ, x2: maxX, z2: minZ });
  // 南墙（带门）
  walls.push({ id: 'outer-south', x1: minX, z1: maxZ, x2: maxX, z2: maxZ, hasDoor: true });
  // 西墙
  walls.push({ id: 'outer-west', x1: minX, z1: minZ, x2: minX, z2: maxZ });
  // 东墙
  walls.push({ id: 'outer-east', x1: maxX, z1: minZ, x2: maxX, z2: maxZ });

  // 内墙：检测相邻房间边界
  for (let i = 0; i < rooms.length; i++) {
    const room1 = rooms[i];
    const r1x = room1.position[0];
    const r1z = room1.position[1];
    const r1w = room1.size[0] / 2;
    const r1d = room1.size[1] / 2;

    for (let j = i + 1; j < rooms.length; j++) {
      const room2 = rooms[j];
      const r2x = room2.position[0];
      const r2z = room2.position[1];
      const r2w = room2.size[0] / 2;
      const r2d = room2.size[1] / 2;

      // 检查是否水平相邻（共享垂直墙）
      const r1Right = r1x + r1w;
      const r2Left = r2x - r2w;
      const r1Left = r1x - r1w;
      const r2Right = r2x + r2w;

      if (Math.abs(r1Right - r2Left) < 0.5) {
        // room1 在 room2 左边
        const zStart = Math.max(r1z - r1d, r2z - r2d);
        const zEnd = Math.min(r1z + r1d, r2z + r2d);
        if (zEnd > zStart) {
          walls.push({
            id: `inner-${room1.id}-${room2.id}`,
            x1: r1Right,
            z1: zStart,
            x2: r1Right,
            z2: zEnd,
            hasDoor: true,
          });
        }
      } else if (Math.abs(r2Right - r1Left) < 0.5) {
        // room2 在 room1 左边
        const zStart = Math.max(r1z - r1d, r2z - r2d);
        const zEnd = Math.min(r1z + r1d, r2z + r2d);
        if (zEnd > zStart) {
          walls.push({
            id: `inner-${room2.id}-${room1.id}`,
            x1: r1Left,
            z1: zStart,
            x2: r1Left,
            z2: zEnd,
            hasDoor: true,
          });
        }
      }

      // 检查是否垂直相邻（共享水平墙）
      const r1Bottom = r1z + r1d;
      const r2Top = r2z - r2d;
      const r1Top = r1z - r1d;
      const r2Bottom = r2z + r2d;

      if (Math.abs(r1Bottom - r2Top) < 0.5) {
        // room1 在 room2 上面
        const xStart = Math.max(r1x - r1w, r2x - r2w);
        const xEnd = Math.min(r1x + r1w, r2x + r2w);
        if (xEnd > xStart) {
          walls.push({
            id: `inner-${room1.id}-${room2.id}-h`,
            x1: xStart,
            z1: r1Bottom,
            x2: xEnd,
            z2: r1Bottom,
            hasDoor: true,
          });
        }
      } else if (Math.abs(r2Bottom - r1Top) < 0.5) {
        // room2 在 room1 上面
        const xStart = Math.max(r1x - r1w, r2x - r2w);
        const xEnd = Math.min(r1x + r1w, r2x + r2w);
        if (xEnd > xStart) {
          walls.push({
            id: `inner-${room2.id}-${room1.id}-h`,
            x1: xStart,
            z1: r1Top,
            x2: xEnd,
            z2: r1Top,
            hasDoor: true,
          });
        }
      }
    }
  }

  return walls;
}

/**
 * 渲染墙壁段
 */
const WallSegmentMesh: React.FC<{
  wall: WallSegment;
  wallHeight: number;
}> = ({ wall, wallHeight }) => {
  const { x1, z1, x2, z2, hasDoor } = wall;
  const isVertical = Math.abs(x1 - x2) < 0.01;
  const length = isVertical ? Math.abs(z2 - z1) : Math.abs(x2 - x1);
  const centerX = (x1 + x2) / 2;
  const centerZ = (z1 + z2) / 2;

  if (hasDoor && length > DOOR_WIDTH + 0.5) {
    // 墙带门
    const doorPos = 0; // 门在中间
    const sideLength = (length - DOOR_WIDTH) / 2;
    const topHeight = wallHeight - DOOR_HEIGHT;

    if (isVertical) {
      return (
        <group position={[centerX, wallHeight / 2, centerZ]}>
          {/* 上半部分 */}
          <mesh position={[0, (wallHeight - topHeight) / 2, doorPos]}>
            <boxGeometry args={[WALL_THICKNESS, topHeight, DOOR_WIDTH]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          {/* 左侧 */}
          <mesh position={[0, 0, -(length / 2 - sideLength / 2)]}>
            <boxGeometry args={[WALL_THICKNESS, wallHeight, sideLength]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          {/* 右侧 */}
          <mesh position={[0, 0, (length / 2 - sideLength / 2)]}>
            <boxGeometry args={[WALL_THICKNESS, wallHeight, sideLength]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
        </group>
      );
    } else {
      return (
        <group position={[centerX, wallHeight / 2, centerZ]}>
          {/* 上半部分 */}
          <mesh position={[doorPos, (wallHeight - topHeight) / 2, 0]}>
            <boxGeometry args={[DOOR_WIDTH, topHeight, WALL_THICKNESS]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          {/* 左侧 */}
          <mesh position={[-(length / 2 - sideLength / 2), 0, 0]}>
            <boxGeometry args={[sideLength, wallHeight, WALL_THICKNESS]} />
            <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
          </mesh>
          {/* 右侧 */}
          <mesh position={[(length / 2 - sideLength / 2), 0, 0]}>
            <boxGeometry args={[sideLength, wallHeight, WALL_THICKNESS]} />
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
 * FloorPlan组件 - 渲染户型
 */
export const FloorPlan: React.FC = () => {
  const homeData = useHomeStore((state) => state.homeData);
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const hoveredRoom = useHomeStore((state) => state.hoveredRoom);
  const toggleRoom = useHomeStore((state) => state.toggleRoom);
  const hoverRoom = useHomeStore((state) => state.hoverRoom);

  const { meta, rooms } = homeData!;
  const { wallHeight } = meta;

  // 计算墙壁
  const walls = useMemo(() => calculateWalls(rooms), [rooms]);

  // 计算地基边界
  const outerBounds = useMemo(() => calculateOuterWalls(rooms), [rooms]);
  const { minX, maxX, minZ, maxZ } = outerBounds;
  const totalWidth = maxX - minX;
  const totalDepth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group>
      {/* 渲染所有房间（地板+设备） */}
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

      {/* 渲染所有墙壁 */}
      {walls.map((wall) => (
        <WallSegmentMesh key={wall.id} wall={wall} wallHeight={wallHeight} />
      ))}

      {/* 地基 */}
      <mesh position={[centerX, -0.1, centerZ]} receiveShadow>
        <boxGeometry args={[totalWidth + 0.5, 0.15, totalDepth + 0.5]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
};

export default FloorPlan;
