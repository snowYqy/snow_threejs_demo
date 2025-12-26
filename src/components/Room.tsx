import { useRef, useMemo } from 'react';
import { Mesh, Color } from 'three';
import { Edges } from '@react-three/drei';
import type { RoomProps } from '../types';

/**
 * Room组件 - 单个房间的3D渲染
 * 
 * 功能:
 * - 渲染地板（BoxGeometry）
 * - 渲染四面墙壁（带透明度）
 * - 支持自定义位置、尺寸、颜色
 * - 悬停状态视觉效果（亮度提升）
 * - 选中状态视觉效果（边框高亮）
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
  const wallThickness = 0.1;
  const wallHeight = height;

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

  const wallColor = useMemo(() => {
    const baseColor = new Color(color);
    if (isSelected) {
      return baseColor.clone().multiplyScalar(1.2);
    }
    if (isHovered) {
      return baseColor.clone().multiplyScalar(1.1);
    }
    return baseColor.clone().multiplyScalar(0.9);
  }, [color, isSelected, isHovered]);

  // 选中状态边框颜色
  const edgeColor = isSelected ? '#FFD700' : isHovered ? '#87CEEB' : undefined;

  // 墙壁透明度
  const wallOpacity = isSelected ? 0.6 : isHovered ? 0.5 : 0.4;

  // 处理指针事件 (使用 Three.js 事件类型)
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
  void id;
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
        {/* 选中/悬停时的边框高亮 */}
        {edgeColor && <Edges color={edgeColor} linewidth={2} threshold={15} />}
      </mesh>

      {/* 北墙 (Z负方向) */}
      <mesh position={[0, 0, -depth / 2 + wallThickness / 2]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={wallOpacity}
        />
        {edgeColor && <Edges color={edgeColor} linewidth={1} threshold={15} />}
      </mesh>

      {/* 南墙 (Z正方向) */}
      <mesh position={[0, 0, depth / 2 - wallThickness / 2]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={wallOpacity}
        />
        {edgeColor && <Edges color={edgeColor} linewidth={1} threshold={15} />}
      </mesh>

      {/* 西墙 (X负方向) */}
      <mesh position={[-width / 2 + wallThickness / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={wallOpacity}
        />
        {edgeColor && <Edges color={edgeColor} linewidth={1} threshold={15} />}
      </mesh>

      {/* 东墙 (X正方向) */}
      <mesh position={[width / 2 - wallThickness / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={wallOpacity}
        />
        {edgeColor && <Edges color={edgeColor} linewidth={1} threshold={15} />}
      </mesh>
    </group>
  );
};

export default Room;
