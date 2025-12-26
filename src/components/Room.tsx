import { useRef, useMemo } from 'react';
import { Mesh, Color } from 'three';
import { Edges } from '@react-three/drei';
import { Furniture } from './Furniture';
import { getFurnitureByRoom } from '../data/floorPlanData';
import type { RoomProps } from '../types';

/**
 * Room组件 - 单个房间的3D渲染
 * 只渲染地板，墙壁由外墙统一渲染
 */
export const Room: React.FC<RoomProps> = ({
  id,
  name,
  position,
  size,
  color,
  isSelected,
  isHovered,
  onClick,
  onHover,
}) => {
  const floorRef = useRef<Mesh>(null);
  const [width, height, depth] = size;

  // 获取房间内的家具
  const furniture = useMemo(() => getFurnitureByRoom(id), [id]);

  // 计算颜色变化
  const floorColor = useMemo(() => {
    const baseColor = new Color(color);
    if (isSelected) {
      return baseColor.clone().multiplyScalar(1.3);
    }
    if (isHovered) {
      return baseColor.clone().multiplyScalar(1.15);
    }
    return baseColor;
  }, [color, isSelected, isHovered]);

  // 选中状态边框颜色
  const edgeColor = isSelected ? '#FFD700' : isHovered ? '#87CEEB' : undefined;

  // 处理指针事件
  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onHover(true);
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onHover(false);
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick();
  };

  // Suppress unused variable warnings
  void name;

  return (
    <group position={position}>
      {/* 地板 */}
      <mesh
        ref={floorRef}
        position={[0, -height / 2 + 0.05, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={floorColor} />
        {edgeColor && <Edges color={edgeColor} linewidth={2} threshold={15} />}
      </mesh>

      {/* 渲染家具 */}
      {furniture.map((f) => (
        <Furniture key={f.id} furniture={f} roomPosition={position} />
      ))}
    </group>
  );
};

export default Room;
