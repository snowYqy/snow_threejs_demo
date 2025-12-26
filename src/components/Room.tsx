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

/**
 * Room组件 - 渲染房间和智能设备
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
    const baseColor = new Color(data.color);
    if (isSelected) return baseColor.clone().multiplyScalar(1.3);
    if (isHovered) return baseColor.clone().multiplyScalar(1.15);
    return baseColor;
  }, [data.color, isSelected, isHovered]);

  const edgeColor = isSelected ? '#FFD700' : isHovered ? '#87CEEB' : undefined;

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
