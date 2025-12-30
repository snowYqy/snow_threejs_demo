import { Layer, Shape, Text } from 'react-konva';
import type { Room, Vertex } from '../../types';
import { calculatePolygonArea } from '../../engine/geometry';
import type { ReactElement } from 'react';

interface RoomLayerProps {
  rooms: Map<string, Room>;
  vertices: Map<string, Vertex>;
  selectedIds: string[];
}

export const RoomLayer: React.FC<RoomLayerProps> = ({ 
  rooms, 
  vertices,
  selectedIds 
}) => {
  const roomElements: ReactElement[] = [];
  
  rooms.forEach((room, roomId) => {
    const points = room.vertexIds
      .map(id => vertices.get(id))
      .filter((v): v is Vertex => v !== undefined);
    
    if (points.length < 3) return;
    
    const isSelected = selectedIds.includes(roomId);
    const area = calculatePolygonArea(points);
    
    // Calculate centroid for label
    const centroid = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };
    
    roomElements.push(
      <Shape
        key={roomId}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x, points[i].y);
          }
          context.closePath();
          context.fillStrokeShape(shape);
        }}
        fill={room.color}
        stroke={isSelected ? '#2196F3' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        opacity={isSelected ? 0.7 : 0.5}
      />
    );
    
    // Room label
    roomElements.push(
      <Text
        key={`${roomId}-label`}
        x={centroid.x - 30}
        y={centroid.y - 10}
        text={`${room.name}\n${(area / 10000).toFixed(1)}m²`}
        fontSize={12}
        fill="#666"
        align="center"
      />
    );
  });
  
  return <Layer listening={false}>{roomElements}</Layer>;
};
