import { useCallback, useMemo } from 'react';
import { Room } from './Room';
import type { HomeData } from '../types/homeData';
import { calculateOuterWalls, getWallGeometry } from '../data/homeDataLoader';

interface FloorPlanProps {
  homeData: HomeData;
  selectedRoom: string | null;
  hoveredRoom: string | null;
  onRoomClick: (roomId: string) => void;
  onRoomHover: (roomId: string | null) => void;
}

/**
 * FloorPlan组件 - 根据数据渲染整个户型
 */
export const FloorPlan: React.FC<FloorPlanProps> = ({
  homeData,
  selectedRoom,
  hoveredRoom,
  onRoomClick,
  onRoomHover,
}) => {
  const { meta, rooms, walls } = homeData;
  const { wallHeight, wallThickness } = meta;

  const handleRoomClick = useCallback((roomId: string) => {
    onRoomClick(roomId);
  }, [onRoomClick]);

  const handleRoomHover = useCallback((roomId: string | null) => {
    onRoomHover(roomId);
  }, [onRoomHover]);

  // 计算外墙边界
  const outerBounds = useMemo(() => calculateOuterWalls(rooms), [rooms]);
  const { minX, maxX, minZ, maxZ } = outerBounds;
  const totalWidth = maxX - minX;
  const totalDepth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const wallColor = '#D0D0D0';
  const wallOpacity = 0.4;
  const innerWallColor = '#C0C0C0';
  const innerWallOpacity = 0.5;

  return (
    <group>
      {/* 渲染所有房间 */}
      {rooms.map((room) => (
        <Room
          key={room.id}
          data={room}
          wallHeight={wallHeight}
          isSelected={selectedRoom === room.id}
          isHovered={hoveredRoom === room.id}
          onClick={() => handleRoomClick(room.id)}
          onHover={(hovered) => handleRoomHover(hovered ? room.id : null)}
        />
      ))}

      {/* 渲染内墙 */}
      {walls.map((wall) => {
        const { position, size } = getWallGeometry(wall, wallHeight, wallThickness);
        return (
          <mesh key={wall.id} position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={innerWallColor} transparent opacity={innerWallOpacity} />
          </mesh>
        );
      })}

      {/* 外墙 - 北 */}
      <mesh position={[centerX, wallHeight / 2, minZ - wallThickness / 2]}>
        <boxGeometry args={[totalWidth + wallThickness * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 南 */}
      <mesh position={[centerX, wallHeight / 2, maxZ + wallThickness / 2]}>
        <boxGeometry args={[totalWidth + wallThickness * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 西 */}
      <mesh position={[minX - wallThickness / 2, wallHeight / 2, centerZ]}>
        <boxGeometry args={[wallThickness, wallHeight, totalDepth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 东 */}
      <mesh position={[maxX + wallThickness / 2, wallHeight / 2, centerZ]}>
        <boxGeometry args={[wallThickness, wallHeight, totalDepth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 地基 */}
      <mesh position={[centerX, -0.05, centerZ]} receiveShadow>
        <boxGeometry args={[totalWidth + 1, 0.1, totalDepth + 1]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
    </group>
  );
};

export default FloorPlan;
