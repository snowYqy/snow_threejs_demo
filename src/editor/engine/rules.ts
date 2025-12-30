import type { Vertex, Wall, Room, Door, Window, EditorError } from '../types';
import { buildGraph, getWallLength } from './geometry';

/**
 * Validate all editor data and return errors
 */
export function validateAll(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>,
  doors: Map<string, Door>,
  windows: Map<string, Window>
): EditorError[] {
  const errors: EditorError[] = [];
  
  errors.push(...validateWalls(vertices, walls, rooms));
  errors.push(...validateDoorsAndWindows(doors, windows, walls, vertices));
  
  return errors;
}

/**
 * Validate walls - check for unclosed walls and self-intersections
 */
export function validateWalls(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>
): EditorError[] {
  const errors: EditorError[] = [];
  const graph = buildGraph(vertices, walls);
  
  // Get all vertex IDs that are part of rooms
  const roomVertexIds = new Set<string>();
  rooms.forEach(room => {
    room.vertexIds.forEach(id => roomVertexIds.add(id));
  });
  
  // Check each wall
  walls.forEach((wall, wallId) => {
    const startVertex = vertices.get(wall.startVertexId);
    const endVertex = vertices.get(wall.endVertexId);
    
    if (!startVertex || !endVertex) {
      errors.push({
        id: `err_${wallId}_invalid`,
        type: 'unclosed_wall',
        message: '墙体端点无效',
        elementId: wallId,
      });
      return;
    }
    
    // Check if wall is part of any room
    const startInRoom = roomVertexIds.has(wall.startVertexId);
    const endInRoom = roomVertexIds.has(wall.endVertexId);
    
    // If neither endpoint is in a room, it's an unclosed wall
    if (!startInRoom && !endInRoom) {
      // Check if vertex has only one connection (dead end)
      const startNode = graph.vertices.get(wall.startVertexId);
      const endNode = graph.vertices.get(wall.endVertexId);
      
      if ((startNode && startNode.edges.length === 1) || 
          (endNode && endNode.edges.length === 1)) {
        errors.push({
          id: `err_${wallId}_unclosed`,
          type: 'unclosed_wall',
          message: '墙体未封闭',
          elementId: wallId,
        });
      }
    }
  });
  
  // Check for self-intersections
  const wallArray = Array.from(walls.values());
  for (let i = 0; i < wallArray.length; i++) {
    for (let j = i + 1; j < wallArray.length; j++) {
      const wall1 = wallArray[i];
      const wall2 = wallArray[j];
      
      // Skip if walls share a vertex
      if (wall1.startVertexId === wall2.startVertexId ||
          wall1.startVertexId === wall2.endVertexId ||
          wall1.endVertexId === wall2.startVertexId ||
          wall1.endVertexId === wall2.endVertexId) {
        continue;
      }
      
      const v1Start = vertices.get(wall1.startVertexId);
      const v1End = vertices.get(wall1.endVertexId);
      const v2Start = vertices.get(wall2.startVertexId);
      const v2End = vertices.get(wall2.endVertexId);
      
      if (v1Start && v1End && v2Start && v2End) {
        if (doSegmentsIntersect(v1Start, v1End, v2Start, v2End)) {
          errors.push({
            id: `err_${wall1.id}_${wall2.id}_intersect`,
            type: 'self_intersect',
            message: '墙体相交',
            elementId: wall1.id,
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate doors and windows
 */
export function validateDoorsAndWindows(
  doors: Map<string, Door>,
  windows: Map<string, Window>,
  walls: Map<string, Wall>,
  vertices: Map<string, Vertex>
): EditorError[] {
  const errors: EditorError[] = [];
  const MIN_DISTANCE_FROM_ENDPOINT = 20; // Minimum distance from wall endpoint
  
  // Validate doors
  doors.forEach((door, doorId) => {
    const wall = walls.get(door.wallId);
    if (!wall) {
      errors.push({
        id: `err_${doorId}_no_wall`,
        type: 'invalid_door',
        message: '门所在墙体不存在',
        elementId: doorId,
      });
      return;
    }
    
    const wallLength = getWallLength(wall, vertices);
    
    // Check if door width exceeds wall length
    if (door.width >= wallLength) {
      errors.push({
        id: `err_${doorId}_too_wide`,
        type: 'invalid_door',
        message: '门宽度超过墙体长度',
        elementId: doorId,
      });
    }
    
    // Check if door is too close to wall endpoints
    const doorStart = door.position * wallLength - door.width / 2;
    const doorEnd = door.position * wallLength + door.width / 2;
    
    if (doorStart < MIN_DISTANCE_FROM_ENDPOINT || 
        wallLength - doorEnd < MIN_DISTANCE_FROM_ENDPOINT) {
      errors.push({
        id: `err_${doorId}_too_close`,
        type: 'invalid_door',
        message: '门距离墙体端点太近',
        elementId: doorId,
      });
    }
  });
  
  // Validate windows
  windows.forEach((window, windowId) => {
    const wall = walls.get(window.wallId);
    if (!wall) {
      errors.push({
        id: `err_${windowId}_no_wall`,
        type: 'invalid_window',
        message: '窗户所在墙体不存在',
        elementId: windowId,
      });
      return;
    }
    
    const wallLength = getWallLength(wall, vertices);
    
    // Check if window width exceeds wall length
    if (window.width >= wallLength) {
      errors.push({
        id: `err_${windowId}_too_wide`,
        type: 'invalid_window',
        message: '窗户宽度超过墙体长度',
        elementId: windowId,
      });
    }
    
    // Check if window is too close to wall endpoints
    const windowStart = window.position * wallLength - window.width / 2;
    const windowEnd = window.position * wallLength + window.width / 2;
    
    if (windowStart < MIN_DISTANCE_FROM_ENDPOINT || 
        wallLength - windowEnd < MIN_DISTANCE_FROM_ENDPOINT) {
      errors.push({
        id: `err_${windowId}_too_close`,
        type: 'invalid_window',
        message: '窗户距离墙体端点太近',
        elementId: windowId,
      });
    }
  });
  
  return errors;
}

/**
 * Check if two line segments intersect (excluding endpoints)
 */
function doSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  
  return false;
}

function direction(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}
