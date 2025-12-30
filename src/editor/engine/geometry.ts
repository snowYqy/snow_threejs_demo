import type { Vertex, Wall, Graph, GraphNode, Point } from '../types';

/**
 * Build graph structure from vertices and walls
 */
export function buildGraph(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>
): Graph {
  const graphVertices = new Map<string, GraphNode>();
  const graphEdges = new Map<string, { start: string; end: string }>();

  // Initialize vertices
  vertices.forEach((vertex, id) => {
    graphVertices.set(id, { x: vertex.x, y: vertex.y, edges: [] });
  });

  // Add edges from walls
  walls.forEach((wall, wallId) => {
    const startNode = graphVertices.get(wall.startVertexId);
    const endNode = graphVertices.get(wall.endVertexId);
    
    if (startNode && endNode) {
      startNode.edges.push(wallId);
      endNode.edges.push(wallId);
      graphEdges.set(wallId, { start: wall.startVertexId, end: wall.endVertexId });
    }
  });

  return { vertices: graphVertices, edges: graphEdges };
}

/**
 * Calculate polygon area using Shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Check if a point is inside a polygon using ray casting
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Find nearest vertex within snap distance
 */
export function findNearestVertex(
  point: Point,
  vertices: Map<string, Vertex>,
  snapDistance: number
): string | null {
  let nearestId: string | null = null;
  let minDistance = snapDistance;
  
  vertices.forEach((vertex, id) => {
    const distance = Math.sqrt(
      Math.pow(vertex.x - point.x, 2) + Math.pow(vertex.y - point.y, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestId = id;
    }
  });
  
  return nearestId;
}

/**
 * Check if two line segments intersect
 */
export function doLinesIntersect(
  line1: { start: Point; end: Point },
  line2: { start: Point; end: Point }
): boolean {
  const { start: p1, end: p2 } = line1;
  const { start: p3, end: p4 } = line2;
  
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  
  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;
  
  return false;
}

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

function onSegment(p1: Point, p2: Point, p: Point): boolean {
  return Math.min(p1.x, p2.x) <= p.x && p.x <= Math.max(p1.x, p2.x) &&
         Math.min(p1.y, p2.y) <= p.y && p.y <= Math.max(p1.y, p2.y);
}

/**
 * Get distance from point to line segment
 */
export function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get wall length
 */
export function getWallLength(wall: Wall, vertices: Map<string, Vertex>): number {
  const start = vertices.get(wall.startVertexId);
  const end = vertices.get(wall.endVertexId);
  if (!start || !end) return 0;
  return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
}

/**
 * Find all closed cycles (rooms) in the graph
 * Uses a simplified approach: find minimal cycles using DFS
 */
export function findAllCycles(
  graph: Graph,
  vertices: Map<string, Vertex>
): string[][] {
  const cycles: string[][] = [];
  
  // Get adjacency list
  const adjacency = new Map<string, string[]>();
  graph.vertices.forEach((_, vertexId) => {
    adjacency.set(vertexId, []);
  });
  
  graph.edges.forEach((edge) => {
    const startAdj = adjacency.get(edge.start);
    const endAdj = adjacency.get(edge.end);
    if (startAdj) startAdj.push(edge.end);
    if (endAdj) endAdj.push(edge.start);
  });
  
  // Find cycles using angle-based traversal
  const foundCycles = new Set<string>();
  
  graph.edges.forEach((edge) => {
    // Try to find cycle starting from each edge in both directions
    for (const startVertex of [edge.start, edge.end]) {
      const nextVertex = startVertex === edge.start ? edge.end : edge.start;
      const cycle = findMinimalCycle(startVertex, nextVertex, adjacency, vertices);
      
      if (cycle && cycle.length >= 3) {
        // Normalize cycle for deduplication
        const normalized = normalizeCycle(cycle);
        const key = normalized.join(',');
        
        if (!foundCycles.has(key)) {
          foundCycles.add(key);
          cycles.push(cycle);
        }
      }
    }
  });
  
  return cycles;
}

/**
 * Find minimal cycle starting from an edge using angle-based traversal
 */
function findMinimalCycle(
  startVertex: string,
  secondVertex: string,
  adjacency: Map<string, string[]>,
  vertices: Map<string, Vertex>
): string[] | null {
  const path = [startVertex, secondVertex];
  let current = secondVertex;
  let prev = startVertex;
  const maxIterations = 100;
  let iterations = 0;
  
  while (iterations < maxIterations) {
    iterations++;
    const neighbors = adjacency.get(current) || [];
    
    if (neighbors.length < 2) return null;
    
    // Find next vertex by choosing the one with smallest clockwise angle
    const currentPos = vertices.get(current);
    const prevPos = vertices.get(prev);
    if (!currentPos || !prevPos) return null;
    
    const incomingAngle = Math.atan2(prevPos.y - currentPos.y, prevPos.x - currentPos.x);
    
    let bestNext: string | null = null;
    let bestAngle = Infinity;
    
    for (const neighbor of neighbors) {
      if (neighbor === prev) continue;
      
      const neighborPos = vertices.get(neighbor);
      if (!neighborPos) continue;
      
      const outgoingAngle = Math.atan2(neighborPos.y - currentPos.y, neighborPos.x - currentPos.x);
      let angleDiff = outgoingAngle - incomingAngle;
      
      // Normalize to [0, 2π)
      while (angleDiff < 0) angleDiff += 2 * Math.PI;
      while (angleDiff >= 2 * Math.PI) angleDiff -= 2 * Math.PI;
      
      // We want the smallest positive angle (rightmost turn)
      if (angleDiff > 0 && angleDiff < bestAngle) {
        bestAngle = angleDiff;
        bestNext = neighbor;
      }
    }
    
    if (!bestNext) return null;
    
    // Check if we've completed the cycle
    if (bestNext === startVertex) {
      return path;
    }
    
    // Check if we're stuck in a loop
    if (path.includes(bestNext)) {
      return null;
    }
    
    path.push(bestNext);
    prev = current;
    current = bestNext;
  }
  
  return null;
}

/**
 * Normalize cycle for comparison (start from smallest vertex ID, ensure consistent direction)
 */
function normalizeCycle(cycle: string[]): string[] {
  if (cycle.length === 0) return cycle;
  
  // Find the index of the smallest vertex ID
  let minIndex = 0;
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i] < cycle[minIndex]) {
      minIndex = i;
    }
  }
  
  // Rotate to start from smallest
  const rotated = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
  
  // Ensure consistent direction (compare second element)
  if (rotated.length > 2) {
    const reversed = [rotated[0], ...rotated.slice(1).reverse()];
    if (reversed[1] < rotated[1]) {
      return reversed;
    }
  }
  
  return rotated;
}
