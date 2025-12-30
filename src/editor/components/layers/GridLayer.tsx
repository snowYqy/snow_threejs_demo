import { Layer, Line } from 'react-konva';
import type { ReactElement } from 'react';

interface GridLayerProps {
  width: number;
  height: number;
  gridSize?: number;
}

export const GridLayer: React.FC<GridLayerProps> = ({ 
  width, 
  height, 
  gridSize = 50 
}) => {
  const lines: ReactElement[] = [];
  
  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e0e0e0"
        strokeWidth={x % (gridSize * 4) === 0 ? 1 : 0.5}
      />
    );
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e0e0e0"
        strokeWidth={y % (gridSize * 4) === 0 ? 1 : 0.5}
      />
    );
  }
  
  return <Layer listening={false}>{lines}</Layer>;
};
