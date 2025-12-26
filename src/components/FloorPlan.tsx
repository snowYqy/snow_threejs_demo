import { useCallback } from 'react';
import { Room } from './Room';
import { floorPlanData } from '../data/floorPlanData';
import type { FloorPlanProps } from '../types';

/**
 * FloorPlan组件 - 户型布局渲染
 * 
 * 功能:
 * - 根据floorPlanData渲染所有房间
 * - 处理房间点击事件（选中/取消选中）
 * - 处理房间悬停事件
 */
export const FloorPlan: React.FC<FloorPlanProps> = ({
  onRoomClick,
  onRoomHover,
  selectedRoom,
  hoveredRoom,
}) => {
  // 处理房间点击 - 切换选中状态
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

  return (
    <group>
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
    </group>
  );
};

export default FloorPlan;
