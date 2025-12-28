import { useRef, useMemo } from 'react';
import { Mesh, Color } from 'three';
import { Edges } from '@react-three/drei';
import { Device } from './Device';
import type { RoomData } from '../types/homeData';
import { getRoomPosition, getRoomSize } from '../data/homeDataLoader';

interface RoomProps {
  data: RoomData;
  wallHeight: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

// 米家风格木质地板颜色 - 更柔和
const FLOOR_COLOR = '#E8D5C4';

/**
 * Room组件 - 只渲染地板和设备，墙壁由FloorPlan统一处理
 * 采用PBR材质实现米家/Apple Home风格
 */
export const Room: React.FC<RoomProps> = ({
  data,
  wallHeight,
  isSelected,
  isHovered,
  onClick,
  onHover,
}) => {
  const floorRef = useRef<Mesh>(null);
  const position = getRoomPosition(data, wallHeight);
  const [width, height, depth] = getRoomSize(data, wallHeight);

  const floorColor = useMemo(() => {
    const baseColor = new Color(FLOOR_COLOR);
    if (isSelected) return baseColor.clone().multiplyScalar(1.08);
    if (isHovered) return baseColor.clone().multiplyScalar(1.04);
    return baseColor;
  }, [isSelected, isHovered]);

  const edgeColor = isSelected ? '#4A90D9' : isHovered ? '#87CEEB' : undefined;

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

  return (
    <group position={position}>
      {/* 木质地板 - PBR材质 */}
      <mesh
        ref={floorRef}
        position={[0, -height / 2 + 0.05, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        receiveShadow
      >
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial 
          color={floorColor} 
          roughness={0.75}
          metalness={0}
        />
        {edgeColor && <Edges color={edgeColor} linewidth={2} threshold={15} />}
      </mesh>

      {/* 渲染智能设备 */}
      {data.devices.map((device) => (
        <Device 
          key={device.id} 
          data={device} 
          wallHeight={wallHeight}
          roomId={data.id}
        />
      ))}
    </group>
  );
};

export default Room;
