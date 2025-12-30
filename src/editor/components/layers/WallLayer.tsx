import { Layer, Line, Circle } from 'react-konva';
import type { Wall, Vertex, EditorError } from '../../types';
import type { ReactElement } from 'react';

interface WallLayerProps {
  walls: Map<string, Wall>;
  vertices: Map<string, Vertex>;
  errors: EditorError[];
  selectedIds: string[];
  hoveredId: string | null;
  onVertexDragMove?: (id: string, x: number, y: number) => void;
  onVertexDragEnd?: (id: string, x: number, y: number) => void;
  onWallClick?: (id: string) => void;
  onVertexClick?: (id: string) => void;
}

export const WallLayer: React.FC<WallLayerProps> = ({
  walls,
  vertices,
  errors,
  selectedIds,
  hoveredId,
  onVertexDragMove,
  onVertexDragEnd,
  onWallClick,
  onVertexClick,
}) => {
  const errorWallIds = new Set(
    errors
      .filter(e => e.type === 'unclosed_wall' || e.type === 'self_intersect')
      .map(e => e.elementId)
  );

  const wallElements: ReactElement[] = [];
  const vertexElements: ReactElement[] = [];

  // Render walls
  walls.forEach((wall, wallId) => {
    const startVertex = vertices.get(wall.startVertexId);
    const endVertex = vertices.get(wall.endVertexId);
    
    if (!startVertex || !endVertex) return;

    const isSelected = selectedIds.includes(wallId);
    const isHovered = hoveredId === wallId;
    const hasError = errorWallIds.has(wallId);

    let strokeColor = '#333';
    if (hasError) strokeColor = '#f44336';
    else if (isSelected) strokeColor = '#2196F3';
    else if (isHovered) strokeColor = '#64B5F6';

    wallElements.push(
      <Line
        key={wallId}
        points={[startVertex.x, startVertex.y, endVertex.x, endVertex.y]}
        stroke={strokeColor}
        strokeWidth={wall.thickness}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={20}
        onClick={() => onWallClick?.(wallId)}
        onTap={() => onWallClick?.(wallId)}
      />
    );
  });

  // Render vertices
  vertices.forEach((vertex, vertexId) => {
    const isSelected = selectedIds.includes(vertexId);
    const isHovered = hoveredId === vertexId;

    vertexElements.push(
      <Circle
        key={vertexId}
        x={vertex.x}
        y={vertex.y}
        radius={isSelected || isHovered ? 8 : 6}
        fill={isSelected ? '#2196F3' : isHovered ? '#64B5F6' : '#fff'}
        stroke="#333"
        strokeWidth={2}
        draggable
        onClick={() => onVertexClick?.(vertexId)}
        onTap={() => onVertexClick?.(vertexId)}
        onDragMove={(e) => {
          onVertexDragMove?.(vertexId, e.target.x(), e.target.y());
        }}
        onDragEnd={(e) => {
          onVertexDragEnd?.(vertexId, e.target.x(), e.target.y());
        }}
      />
    );
  });

  return (
    <Layer>
      {wallElements}
      {vertexElements}
    </Layer>
  );
};
