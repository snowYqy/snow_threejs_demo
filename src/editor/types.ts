// 2D Floor Plan Editor Types

export interface Vertex {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startVertexId: string;
  endVertexId: string;
  thickness: number;
}

export interface Room {
  id: string;
  vertexIds: string[];
  color: string;
  name: string;
}

export interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1, relative position on wall
  width: number;
  direction: 'left' | 'right';
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
}

export type ToolType = 'select' | 'drawWall' | 'delete' | 'door' | 'window';

export type EditorErrorType = 
  | 'unclosed_wall' 
  | 'invalid_door' 
  | 'invalid_window' 
  | 'self_intersect';

export interface EditorError {
  id: string;
  type: EditorErrorType;
  message: string;
  elementId: string;
}

export interface Point {
  x: number;
  y: number;
}

// Graph structure for geometry calculations
export interface GraphNode {
  x: number;
  y: number;
  edges: string[];
}

export interface GraphEdge {
  start: string;
  end: string;
}

export interface Graph {
  vertices: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}
