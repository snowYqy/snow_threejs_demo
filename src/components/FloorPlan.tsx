import { useMemo } from 'react';
import { Room } from './Room';
import { useHomeStore } from '../store/useHomeStore';
import { calculateOuterWalls } from '../data/homeDataLoader';

/**
 * FloorPlan组件 - 根据store数据渲染整个户型
 */
export const FloorPlan: React.FC = () => {
  const homeData = useHomeStore((state) => state.homeData);
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const hoveredRoom = useHomeStore((state) => state.hoveredRoom);
  const toggleRoom = useHomeStore((state) => state.toggleRoom);
  const hoverRoom = useHomeStore((state) => state.hoverRoom);

  const { meta, rooms } = homeData!;
  const { wallHeight } = meta;

  // 计算地基边界
  const outerBounds = useMemo(() => calculateOuterWalls(rooms), [rooms]);
  const { minX, maxX, minZ, maxZ } = outerBounds;
  const totalWidth = maxX - minX;
  const totalDepth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group>
      {/* 渲染所有房间（每个房间自带墙壁） */}
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

      {/* 地基 */}
      <mesh position={[centerX, -0.1, centerZ]} receiveShadow>
        <boxGeometry args={[totalWidth + 2, 0.15, totalDepth + 2]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
};

export default FloorPlan;
