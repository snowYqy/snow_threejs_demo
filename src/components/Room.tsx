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

// 木质地板颜色
const FLOOR_COLOR = '#D4A574';
// 墙壁颜色（淡蓝色半透明）
const WALL_COLOR = '#B8D4E8';
const WALL_OPACITY = 0.35;
const WALL_THICKNESS = 0.08;
// 门的尺寸
const DOOR_WIDTH = 0.9;
const DOOR_HEIGHT = 2.2;

/**
 * Room组件 - 渲染房间、墙壁和智能设备
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

  // 地板颜色（选中/悬停时高亮）
  const floorColor = useMemo(() => {
    const baseColor = new Color(FLOOR_COLOR);
    if (isSelected) return baseColor.clone().multiplyScalar(1.2);
    if (isHovered) return baseColor.clone().multiplyScalar(1.1);
    return baseColor;
  }, [isSelected, isHovered]);

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

  // 渲染带门的墙壁
  const renderWallWithDoor = (
    wallWidth: number,
    wallHeight: number,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0]
  ) => {
    const doorOffset = 0; // 门在墙中间
    const leftWidth = (wallWidth - DOOR_WIDTH) / 2;
    const rightWidth = (wallWidth - DOOR_WIDTH) / 2;
    const topHeight = wallHeight - DOOR_HEIGHT;

    return (
      <group position={position} rotation={rotation}>
        {/* 左侧墙 */}
        <mesh position={[-(wallWidth / 2 - leftWidth / 2), 0, 0]}>
          <boxGeometry args={[leftWidth, wallHeight, WALL_THICKNESS]} />
          <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
        </mesh>
        {/* 右侧墙 */}
        <mesh position={[(wallWidth / 2 - rightWidth / 2), 0, 0]}>
          <boxGeometry args={[rightWidth, wallHeight, WALL_THICKNESS]} />
          <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
        </mesh>
        {/* 门上方墙 */}
        <mesh position={[doorOffset, (wallHeight - topHeight) / 2, 0]}>
          <boxGeometry args={[DOOR_WIDTH, topHeight, WALL_THICKNESS]} />
          <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
        </mesh>
        {/* 门框 */}
        <mesh position={[doorOffset, -wallHeight / 2 + DOOR_HEIGHT / 2, 0]}>
          <boxGeometry args={[DOOR_WIDTH + 0.1, DOOR_HEIGHT, WALL_THICKNESS + 0.02]} />
          <meshStandardMaterial color="#8B4513" transparent opacity={0.3} />
        </mesh>
      </group>
    );
  };

  // 渲染完整墙壁（无门）
  const renderSolidWall = (
    wallWidth: number,
    wallHeight: number,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0]
  ) => {
    return (
      <mesh position={position} rotation={rotation}>
        <boxGeometry args={[wallWidth, wallHeight, WALL_THICKNESS]} />
        <meshStandardMaterial color={WALL_COLOR} transparent opacity={WALL_OPACITY} />
      </mesh>
    );
  };

  return (
    <group position={position}>
      {/* 木质地板 */}
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

      {/* 四面墙壁 */}
      {/* 北墙（带门） */}
      {renderWallWithDoor(width, height, [0, 0, -depth / 2 + WALL_THICKNESS / 2])}
      
      {/* 南墙（实心） */}
      {renderSolidWall(width, height, [0, 0, depth / 2 - WALL_THICKNESS / 2])}
      
      {/* 西墙（实心） */}
      {renderSolidWall(depth, height, [-width / 2 + WALL_THICKNESS / 2, 0, 0], [0, Math.PI / 2, 0])}
      
      {/* 东墙（实心） */}
      {renderSolidWall(depth, height, [width / 2 - WALL_THICKNESS / 2, 0, 0], [0, Math.PI / 2, 0])}

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
