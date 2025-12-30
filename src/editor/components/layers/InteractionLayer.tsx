import { Layer, Line, Circle } from 'react-konva';
import type { Vertex } from '../../types';
import type { ReactElement } from 'react';

interface InteractionLayerProps {
  drawingVertexId: string | null;
  previewPoint: { x: number; y: number } | null;
  vertices: Map<string, Vertex>;
  snapVertex: Vertex | null;
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
  drawingVertexId,
  previewPoint,
  vertices,
  snapVertex,
}) => {
  const elements: ReactElement[] = [];

  // Preview line while drawing
  if (drawingVertexId && previewPoint) {
    const startVertex = vertices.get(drawingVertexId);
    if (startVertex) {
      elements.push(
        <Line
          key="preview-line"
          points={[startVertex.x, startVertex.y, previewPoint.x, previewPoint.y]}
          stroke="#2196F3"
          strokeWidth={2}
          dash={[10, 5]}
          opacity={0.7}
        />
      );
    }
  }

  // Snap indicator
  if (snapVertex) {
    elements.push(
      <Circle
        key="snap-indicator"
        x={snapVertex.x}
        y={snapVertex.y}
        radius={12}
        stroke="#4CAF50"
        strokeWidth={2}
        dash={[4, 4]}
        fill="transparent"
      />
    );
  }

  // Preview point
  if (previewPoint && !snapVertex) {
    elements.push(
      <Circle
        key="preview-point"
        x={previewPoint.x}
        y={previewPoint.y}
        radius={4}
        fill="#2196F3"
        opacity={0.5}
      />
    );
  }

  return <Layer listening={false}>{elements}</Layer>;
};
