import { useRef, useMemo } from 'react';
import { Mesh, Color } from 'three';
import { Edges, useTexture } from '@react-three/drei';
import { Device } from './Device';
import type { RoomData } from '../types/homeData';
import { getRoomPosition, getRoomSize } from '../data/homeDataLoader';
import * as THREE from 'three';

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

  const floorTexture = useTexture('/textures/laminate_floor_02_diff_2k.jpg');


useMemo(() => {
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(width / 2, depth / 2);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
}, [floorTexture, width, depth]);

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
    map={floorTexture}
    roughness={0.75}
    metalness={0}
    emissive={floorColor}
    emissiveIntensity={isSelected ? 0.12 : isHovered ? 0.06 : 0}
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
