import { useCallback, useMemo } from 'react';
import { Room } from './Room';
import { floorPlanData } from '../data/floorPlanData';
import type { FloorPlanProps } from '../types';

/**
 * FloorPlan组件 - 户型布局渲染
 * 渲染所有房间和外墙
 */
export const FloorPlan: React.FC<FloorPlanProps> = ({
  onRoomClick,
  onRoomHover,
  selectedRoom,
  hoveredRoom,
}) => {
  // 处理房间点击
  const handleRoomClick = useCallback(
    (roomId: string) => {
      onRoomClick(roomId);
    },
    [onRoomClick]
  );

  // 处理房间悬停
  const handleRoomHover = useCallback(
    (roomId: string | null) => {
      onRoomHover(roomId);
    },
    [onRoomHover]
  );

  // 计算外墙边界
  const wallBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    floorPlanData.rooms.forEach(room => {
      const [x, , z] = room.position;
      const [w, , d] = room.size;
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      minZ = Math.min(minZ, z - d / 2);
      maxZ = Math.max(maxZ, z + d / 2);
    });

    return { minX, maxX, minZ, maxZ };
  }, []);

  const wallHeight = 3;
  const wallThickness = 0.15;
  const wallColor = '#E0E0E0';
  const wallOpacity = 0.3;

  const { minX, maxX, minZ, maxZ } = wallBounds;
  const totalWidth = maxX - minX;
  const totalDepth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group>
      {/* 渲染所有房间 */}
      {floorPlanData.rooms.map((room) => (
        <Room
          key={room.id}
          id={room.id}
          name={room.name}
          position={room.position}
          size={room.size}
          color={room.color}
          isSelected={selectedRoom === room.id}
          isHovered={hoveredRoom === room.id}
          onClick={() => handleRoomClick(room.id)}
          onHover={(hovered) => handleRoomHover(hovered ? room.id : null)}
        />
      ))}

      {/* 外墙 - 北墙 */}
      <mesh position={[centerX, wallHeight / 2, minZ - wallThickness / 2]}>
        <boxGeometry args={[totalWidth + wallThickness * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 南墙 */}
      <mesh position={[centerX, wallHeight / 2, maxZ + wallThickness / 2]}>
        <boxGeometry args={[totalWidth + wallThickness * 2, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 西墙 */}
      <mesh position={[minX - wallThickness / 2, wallHeight / 2, centerZ]}>
        <boxGeometry args={[wallThickness, wallHeight, totalDepth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={wallOpacity} />
      </mesh>

      {/* 外墙 - 东墙 */}
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
