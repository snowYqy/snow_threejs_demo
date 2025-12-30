import { Layer, Line, Arc, Rect } from 'react-konva';
import type { Door, Window, Wall, Vertex, EditorError } from '../../types';
import type { ReactElement } from 'react';

interface DoorWindowLayerProps {
  doors: Map<string, Door>;
  windows: Map<string, Window>;
  walls: Map<string, Wall>;
  vertices: Map<string, Vertex>;
  errors: EditorError[];
  selectedIds: string[];
  hoveredId: string | null;
  onDoorClick?: (id: string) => void;
  onWindowClick?: (id: string) => void;
}

export const DoorWindowLayer: React.FC<DoorWindowLayerProps> = ({
  doors,
  windows,
  walls,
  vertices,
  errors,
  selectedIds,
  hoveredId,
  onDoorClick,
  onWindowClick,
}) => {
  const errorIds = new Set(
    errors
      .filter(e => e.type === 'invalid_door' || e.type === 'invalid_window')
      .map(e => e.elementId)
  );

  const elements: ReactElement[] = [];

  // Render doors
  doors.forEach((door, doorId) => {
    const wall = walls.get(door.wallId);
    if (!wall) return;

    const startVertex = vertices.get(wall.startVertexId);
    const endVertex = vertices.get(wall.endVertexId);
    if (!startVertex || !endVertex) return;

    // Calculate door position on wall
    const dx = endVertex.x - startVertex.x;
    const dy = endVertex.y - startVertex.y;
    const angle = Math.atan2(dy, dx);

    const doorX = startVertex.x + dx * door.position;
    const doorY = startVertex.y + dy * door.position;

    const isSelected = selectedIds.includes(doorId);
    const isHovered = hoveredId === doorId;
    const hasError = errorIds.has(doorId);

    let strokeColor = '#8B4513';
    if (hasError) strokeColor = '#f44336';
    else if (isSelected) strokeColor = '#2196F3';
    else if (isHovered) strokeColor = '#64B5F6';

    // Door opening (gap in wall)
    elements.push(
      <Line
        key={`${doorId}-gap`}
        points={[
          doorX - (door.width / 2) * Math.cos(angle),
          doorY - (door.width / 2) * Math.sin(angle),
          doorX + (door.width / 2) * Math.cos(angle),
          doorY + (door.width / 2) * Math.sin(angle),
        ]}
        stroke="#fff"
        strokeWidth={wall.thickness + 4}
      />
    );

    // Door swing arc
    const arcAngle = door.direction === 'left' ? angle - Math.PI / 2 : angle + Math.PI / 2;
    elements.push(
      <Arc
        key={`${doorId}-arc`}
        x={doorX - (door.width / 2) * Math.cos(angle)}
        y={doorY - (door.width / 2) * Math.sin(angle)}
        innerRadius={0}
        outerRadius={door.width}
        angle={90}
        rotation={(arcAngle * 180) / Math.PI}
        stroke={strokeColor}
        strokeWidth={1}
        dash={[4, 4]}
        onClick={() => onDoorClick?.(doorId)}
        onTap={() => onDoorClick?.(doorId)}
      />
    );

    // Door line
    elements.push(
      <Line
        key={`${doorId}-door`}
        points={[
          doorX - (door.width / 2) * Math.cos(angle),
          doorY - (door.width / 2) * Math.sin(angle),
          doorX - (door.width / 2) * Math.cos(angle) + door.width * Math.cos(arcAngle),
          doorY - (door.width / 2) * Math.sin(angle) + door.width * Math.sin(arcAngle),
        ]}
        stroke={strokeColor}
        strokeWidth={3}
        onClick={() => onDoorClick?.(doorId)}
        onTap={() => onDoorClick?.(doorId)}
      />
    );
  });

  // Render windows
  windows.forEach((window, windowId) => {
    const wall = walls.get(window.wallId);
    if (!wall) return;

    const startVertex = vertices.get(wall.startVertexId);
    const endVertex = vertices.get(wall.endVertexId);
    if (!startVertex || !endVertex) return;

    const dx = endVertex.x - startVertex.x;
    const dy = endVertex.y - startVertex.y;
    const angle = Math.atan2(dy, dx);

    const windowX = startVertex.x + dx * window.position;
    const windowY = startVertex.y + dy * window.position;

    const isSelected = selectedIds.includes(windowId);
    const isHovered = hoveredId === windowId;
    const hasError = errorIds.has(windowId);

    let strokeColor = '#4FC3F7';
    if (hasError) strokeColor = '#f44336';
    else if (isSelected) strokeColor = '#2196F3';
    else if (isHovered) strokeColor = '#64B5F6';

    // Window opening (gap in wall)
    elements.push(
      <Line
        key={`${windowId}-gap`}
        points={[
          windowX - (window.width / 2) * Math.cos(angle),
          windowY - (window.width / 2) * Math.sin(angle),
          windowX + (window.width / 2) * Math.cos(angle),
          windowY + (window.width / 2) * Math.sin(angle),
        ]}
        stroke="#fff"
        strokeWidth={wall.thickness + 4}
      />
    );

    // Window frame
    const perpAngle = angle + Math.PI / 2;
    const frameWidth = 4;
    
    elements.push(
      <Rect
        key={`${windowId}-frame`}
        x={windowX - (window.width / 2) * Math.cos(angle) - frameWidth * Math.cos(perpAngle)}
        y={windowY - (window.width / 2) * Math.sin(angle) - frameWidth * Math.sin(perpAngle)}
        width={window.width}
        height={frameWidth * 2}
        rotation={(angle * 180) / Math.PI}
        fill="#E3F2FD"
        stroke={strokeColor}
        strokeWidth={2}
        onClick={() => onWindowClick?.(windowId)}
        onTap={() => onWindowClick?.(windowId)}
      />
    );

    // Window divider lines
    elements.push(
      <Line
        key={`${windowId}-divider`}
        points={[
          windowX - frameWidth * Math.cos(perpAngle),
          windowY - frameWidth * Math.sin(perpAngle),
          windowX + frameWidth * Math.cos(perpAngle),
          windowY + frameWidth * Math.sin(perpAngle),
        ]}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  });

  return <Layer>{elements}</Layer>;
};
