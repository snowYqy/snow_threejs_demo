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

interface WallSegment {
  id: string;
  start: [number, number];
  end: [number, number];
  hasDoor: boolean;
  isOuter: boolean;
}

interface RoomBounds {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function getRoomBounds(room: RoomData): RoomBounds {
  const [cx, cz] = room.position;
  const [w, d] = room.size;
  return {
    id: room.id,
    left: cx - w / 2,
    right: cx + w / 2,
    top: cz - d / 2,
    bottom: cz + d / 2,
  };
}

function isAdjacent(b1: RoomBounds, b2: RoomBounds, tolerance = 0.01): 'left' | 'right' | 'top' | 'bottom' | null {
  // Check if b2 is to the right of b1
  if (Math.abs(b1.right - b2.left) < tolerance) {
    const overlapStart = Math.max(b1.top, b2.top);
    const overlapEnd = Math.min(b1.bottom, b2.bottom);
    if (overlapEnd > overlapStart + tolerance) return 'right';
  }
  // Check if b2 is to the left of b1
  if (Math.abs(b1.left - b2.right) < tolerance) {
    const overlapStart = Math.max(b1.top, b2.top);
    const overlapEnd = Math.min(b1.bottom, b2.bottom);
    if (overlapEnd > overlapStart + tolerance) return 'left';
  }
  // Check if b2 is below b1
  if (Math.abs(b1.bottom - b2.top) < tolerance) {
    const overlapStart = Math.max(b1.left, b2.left);
    const overlapEnd = Math.min(b1.right, b2.right);
    if (overlapEnd > overlapStart + tolerance) return 'bottom';
  }
  // Check if b2 is above b1
  if (Math.abs(b1.top - b2.bottom) < tolerance) {
    const overlapStart = Math.max(b1.left, b2.left);
    const overlapEnd = Math.min(b1.right, b2.right);
    if (overlapEnd > overlapStart + tolerance) return 'top';
  }
  return null;
}

function generateWalls(rooms: RoomData[]): WallSegment[] {
  const walls: WallSegment[] = [];
  const roomBounds = rooms.map(getRoomBounds);
  
  // Calculate overall bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  roomBounds.forEach(b => {
    minX = Math.min(minX, b.left);
    maxX = Math.max(maxX, b.right);
    minZ = Math.min(minZ, b.top);
    maxZ = Math.max(maxZ, b.bottom);
  });

  // Find adjacencies for each room
  const adjacencies = new Map<string, Map<string, 'left' | 'right' | 'top' | 'bottom'>>();
  roomBounds.forEach(b1 => {
    adjacencies.set(b1.id, new Map());
    roomBounds.forEach(b2 => {
      if (b1.id === b2.id) return;
      const adj = isAdjacent(b1, b2);
      if (adj) adjacencies.get(b1.id)!.set(b2.id, adj);
    });
  });

  // Generate walls for each room
  roomBounds.forEach(bounds => {
    const adj = adjacencies.get(bounds.id)!;
    const { left, right, top, bottom, id } = bounds;

    // Get adjacent rooms for each side
    const adjRight = Array.from(adj.entries()).filter(([, dir]) => dir === 'right').map(([rid]) => roomBounds.find(b => b.id === rid)!);
    const adjLeft = Array.from(adj.entries()).filter(([, dir]) => dir === 'left').map(([rid]) => roomBounds.find(b => b.id === rid)!);
    const adjBottom = Array.from(adj.entries()).filter(([, dir]) => dir === 'bottom').map(([rid]) => roomBounds.find(b => b.id === rid)!);
    const adjTop = Array.from(adj.entries()).filter(([, dir]) => dir === 'top').map(([rid]) => roomBounds.find(b => b.id === rid)!);

    // Right wall
    if (adjRight.length === 0) {
      walls.push({ id: `${id}-right`, start: [right, top], end: [right, bottom], hasDoor: false, isOuter: Math.abs(right - maxX) < 0.01 });
    } else {
      // Generate wall segments with gaps for adjacent rooms
      const segments = generateWallSegments(top, bottom, adjRight.map(b => [b.top, b.bottom] as [number, number]));
      segments.forEach((seg, i) => {
        walls.push({ id: `${id}-right-${i}`, start: [right, seg[0]], end: [right, seg[1]], hasDoor: false, isOuter: false });
      });
    }

    // Left wall
    if (adjLeft.length === 0) {
      walls.push({ id: `${id}-left`, start: [left, top], end: [left, bottom], hasDoor: false, isOuter: Math.abs(left - minX) < 0.01 });
    } else {
      const segments = generateWallSegments(top, bottom, adjLeft.map(b => [b.top, b.bottom] as [number, number]));
      segments.forEach((seg, i) => {
        walls.push({ id: `${id}-left-${i}`, start: [left, seg[0]], end: [left, seg[1]], hasDoor: false, isOuter: false });
      });
    }

    // Bottom wall
    if (adjBottom.length === 0) {
      walls.push({ id: `${id}-bottom`, start: [left, bottom], end: [right, bottom], hasDoor: false, isOuter: Math.abs(bottom - maxZ) < 0.01 });
    } else {
      const segments = generateWallSegments(left, right, adjBottom.map(b => [b.left, b.right] as [number, number]));
      segments.forEach((seg, i) => {
        walls.push({ id: `${id}-bottom-${i}`, start: [seg[0], bottom], end: [seg[1], bottom], hasDoor: false, isOuter: false });
      });
    }

    // Top wall
    if (adjTop.length === 0) {
      walls.push({ id: `${id}-top`, start: [left, top], end: [right, top], hasDoor: false, isOuter: Math.abs(top - minZ) < 0.01 });
    } else {
      const segments = generateWallSegments(left, right, adjTop.map(b => [b.left, b.right] as [number, number]));
      segments.forEach((seg, i) => {
        walls.push({ id: `${id}-top-${i}`, start: [seg[0], top], end: [seg[1], top], hasDoor: false, isOuter: false });
      });
    }
  });

  // Add inner walls with doors between adjacent rooms
  const addedInnerWalls = new Set<string>();
  roomBounds.forEach(b1 => {
    const adj = adjacencies.get(b1.id)!;
    adj.forEach((dir, b2Id) => {
      const key = [b1.id, b2Id].sort().join('-');
      if (addedInnerWalls.has(key)) return;
      addedInnerWalls.add(key);

      const b2 = roomBounds.find(b => b.id === b2Id)!;
      
      if (dir === 'right' || dir === 'left') {
        const wallX = dir === 'right' ? b1.right : b1.left;
        const overlapStart = Math.max(b1.top, b2.top);
        const overlapEnd = Math.min(b1.bottom, b2.bottom);
        if (overlapEnd > overlapStart + 0.5) {
          walls.push({
            id: `inner-${key}`,
            start: [wallX, overlapStart],
            end: [wallX, overlapEnd],
            hasDoor: true,
            isOuter: false,
          });
        }
      } else {
        const wallZ = dir === 'bottom' ? b1.bottom : b1.top;
        const overlapStart = Math.max(b1.left, b2.left);
        const overlapEnd = Math.min(b1.right, b2.right);
        if (overlapEnd > overlapStart + 0.5) {
          walls.push({
            id: `inner-${key}`,
            start: [overlapStart, wallZ],
            end: [overlapEnd, wallZ],
            hasDoor: true,
            isOuter: false,
          });
        }
      }
    });
  });

  // Deduplicate walls
  const uniqueWalls: WallSegment[] = [];
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

// Generate wall segments excluding overlapping ranges
function generateWallSegments(start: number, end: number, excludeRanges: [number, number][]): [number, number][] {
  if (excludeRanges.length === 0) return [[start, end]];
  
  // Merge overlapping exclude ranges
  const sorted = [...excludeRanges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  sorted.forEach(range => {
    if (merged.length === 0 || merged[merged.length - 1][1] < range[0]) {
      merged.push([...range]);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], range[1]);
    }
  });

  // Generate segments
  const segments: [number, number][] = [];
  let current = start;
  merged.forEach(([exStart, exEnd]) => {
    if (current < exStart) {
      segments.push([current, exStart]);
    }
    current = Math.max(current, exEnd);
  });
  if (current < end) {
    segments.push([current, end]);
  }

  return segments.filter(([s, e]) => e - s > 0.1);
}

const Wall: React.FC<{ wall: WallSegment; wallHeight: number }> = ({ wall, wallHeight }) => {
  const { start, end, hasDoor } = wall;
  const isVertical = Math.abs(start[0] - end[0]) < 0.01;
  const length = isVertical 
    ? Math.abs(end[1] - start[1]) 
    : Math.abs(end[0] - start[0]);
  const centerX = (start[0] + end[0]) / 2;
  const centerZ = (start[1] + end[1]) / 2;

  if (length < 0.1) return null;

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
          {topH > 0.1 && (
            <mesh position={[0, (wallHeight - topH) / 2, 0]}>
              <boxGeometry args={[WALL_THICKNESS, topH, DOOR_WIDTH]} />
              <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
            </mesh>
          )}
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
          {topH > 0.1 && (
            <mesh position={[0, (wallHeight - topH) / 2, 0]}>
              <boxGeometry args={[DOOR_WIDTH, topH, WALL_THICKNESS]} />
              <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
            </mesh>
          )}
        </group>
      );
    }
  }

  return (
    <mesh position={[centerX, wallHeight / 2, centerZ]}>
      <boxGeometry args={isVertical ? [WALL_THICKNESS, wallHeight, length] : [length, wallHeight, WALL_THICKNESS]} />
      <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
    </mesh>
  );
};

export const FloorPlan: React.FC = () => {
  const homeData = useHomeStore((state) => state.homeData);
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const hoveredRoom = useHomeStore((state) => state.hoveredRoom);
  const toggleRoom = useHomeStore((state) => state.toggleRoom);
  const hoverRoom = useHomeStore((state) => state.hoverRoom);

  const { meta, rooms } = homeData!;
  const { wallHeight } = meta;

  const walls = useMemo(() => generateWalls(rooms), [rooms]);

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

      {walls.map((wall) => (
        <Wall key={wall.id} wall={wall} wallHeight={wallHeight} />
      ))}

      <mesh position={[(minX + maxX) / 2, -0.1, (minZ + maxZ) / 2]} receiveShadow>
        <boxGeometry args={[maxX - minX + 0.5, 0.15, maxZ - minZ + 0.5]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
};

export default FloorPlan;
