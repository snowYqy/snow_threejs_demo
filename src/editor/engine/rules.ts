import type { Vertex, Wall, Room, Door, Window, EditorError, ValidationResult, Point } from '../types';
import { EDITOR_CONFIG } from '../types';
import { buildGraph, getWallLength, calculatePolygonArea, doPolygonsOverlap } from './geometry';

/**
 * 完整验证所有编辑器数据
 * 返回验证结果，包含是否可导出3D
 */
export function validateAll(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>,
  doors: Map<string, Door>,
  windows: Map<string, Window>
): ValidationResult {
  const errors: EditorError[] = [];
  const warnings: EditorError[] = [];
  
  // L1 规则验证（Hard Rules）
  const l1Errors = validateL1Rules(vertices, walls, rooms, doors, windows);
  errors.push(...l1Errors.filter(e => e.level === 'error'));
  warnings.push(...l1Errors.filter(e => e.level === 'warning'));
  
  // L2 规则验证（Smart Home Core）
  const l2Errors = validateL2Rules(vertices, walls, rooms);
  errors.push(...l2Errors.filter(e => e.level === 'error'));
  warnings.push(...l2Errors.filter(e => e.level === 'warning'));
  
  // 计算统计信息
  let totalArea = 0;
  rooms.forEach(room => {
    if (room.area) totalArea += room.area;
  });
  
  // L1规则全部通过才能导出
  const hasL1Errors = l1Errors.some(e => e.level === 'error');
  
  return {
    isValid: errors.length === 0,
    canExport: !hasL1Errors && rooms.size > 0,
    errors,
    warnings,
    roomCount: rooms.size,
    totalArea,
  };
}

/**
 * L1 - 结构可用性规则（Hard Rules）
 * 不满足 = 禁止进入 3D / 禁止配置设备
 */
function validateL1Rules(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>,
  doors: Map<string, Door>,
  windows: Map<string, Window>
): EditorError[] {
  const errors: EditorError[] = [];
  
  // L1-1 墙体封闭性
  errors.push(...validateWallClosure(vertices, walls, rooms));
  
  // L1-2 墙体合法性
  errors.push(...validateWallLegality(vertices, walls));
  
  // L1-3 门/窗依附墙体
  errors.push(...validateDoorsAndWindows(doors, windows, walls, vertices));
  
  return errors;
}

/**
 * L1-1 墙体封闭性验证
 */
function validateWallClosure(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>,
  rooms: Map<string, Room>
): EditorError[] {
  const errors: EditorError[] = [];
  
  // 检查是否至少存在1个闭合区域
  if (rooms.size === 0 && walls.size > 0) {
    errors.push({
      id: 'err_no_closed_room',
      type: 'no_closed_room',
      level: 'error',
      message: '未检测到闭合房间，请确保墙体形成封闭区域',
      elementId: '',
      autoFixable: false,
    });
  }
  
  // 检查每个房间面积
  rooms.forEach((room, roomId) => {
    const points = room.vertexIds
      .map(id => vertices.get(id))
      .filter((v): v is Vertex => v !== undefined);
    
    if (points.length >= 3) {
      const area = calculatePolygonArea(points);
      if (area < EDITOR_CONFIG.MIN_ROOM_AREA) {
        errors.push({
          id: `err_${roomId}_too_small`,
          type: 'room_too_small',
          level: 'warning',
          message: `房间 "${room.name}" 面积过小 (${(area / 10000).toFixed(2)}㎡ < 1㎡)`,
          elementId: roomId,
          autoFixable: false,
        });
      }
    }
  });
  
  return errors;
}

/**
 * L1-2 墙体合法性验证
 */
function validateWallLegality(
  vertices: Map<string, Vertex>,
  walls: Map<string, Wall>
): EditorError[] {
  const errors: EditorError[] = [];
  const graph = buildGraph(vertices, walls);
  
  // 检查墙长度
  walls.forEach((wall, wallId) => {
    const length = getWallLength(wall, vertices);
    if (length < EDITOR_CONFIG.MIN_WALL_LENGTH) {
      errors.push({
        id: `err_${wallId}_too_short`,
        type: 'wall_too_short',
        level: 'warning',
        message: `墙体过短 (${length.toFixed(0)}cm < ${EDITOR_CONFIG.MIN_WALL_LENGTH}cm)`,
        elementId: wallId,
        autoFixable: true,
      });
    }
  });
  
  // 检查墙体端点连接数（必须是0或>=2）
  graph.vertices.forEach((node, vertexId) => {
    if (node.edges.length === 1) {
      errors.push({
        id: `err_${vertexId}_dead_end`,
        type: 'wall_dead_end',
        level: 'warning',
        message: '墙体存在断点（未封闭）',
        elementId: node.edges[0],
        autoFixable: true,
      });
    }
  });
  
  // 检查墙体自交
  const wallArray = Array.from(walls.entries());
  for (let i = 0; i < wallArray.length; i++) {
    for (let j = i + 1; j < wallArray.length; j++) {
      const [id1, wall1] = wallArray[i];
      const [id2, wall2] = wallArray[j];
      
      // 跳过共享顶点的墙
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
            id: `err_${id1}_${id2}_intersect`,
            type: 'wall_self_intersect',
            level: 'error',
            message: '墙体相交',
            elementId: id1,
            autoFixable: false,
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * L1-3 门/窗依附墙体验证
 */
function validateDoorsAndWindows(
  doors: Map<string, Door>,
  windows: Map<string, Window>,
  walls: Map<string, Wall>,
  vertices: Map<string, Vertex>
): EditorError[] {
  const errors: EditorError[] = [];
  const MIN_DISTANCE = EDITOR_CONFIG.DOOR_WINDOW_MIN_DISTANCE;
  
  // 验证门
  doors.forEach((door, doorId) => {
    const wall = walls.get(door.wallId);
    if (!wall) {
      errors.push({
        id: `err_${doorId}_no_wall`,
        type: 'door_no_wall',
        level: 'error',
        message: '门所在墙体不存在',
        elementId: doorId,
        autoFixable: false,
      });
      return;
    }
    
    const wallLength = getWallLength(wall, vertices);
    
    // 门宽度检查
    if (door.width >= wallLength) {
      errors.push({
        id: `err_${doorId}_too_wide`,
        type: 'door_too_wide',
        level: 'error',
        message: '门宽度超过墙体长度',
        elementId: doorId,
        autoFixable: true,
      });
    }
    
    // 门位置检查
    const doorStart = door.position * wallLength - door.width / 2;
    const doorEnd = door.position * wallLength + door.width / 2;
    
    if (doorStart < MIN_DISTANCE || wallLength - doorEnd < MIN_DISTANCE) {
      errors.push({
        id: `err_${doorId}_out_of_wall`,
        type: 'door_out_of_wall',
        level: 'warning',
        message: '门距离墙体端点太近',
        elementId: doorId,
        autoFixable: true,
      });
    }
  });
  
  // 验证窗
  windows.forEach((window, windowId) => {
    const wall = walls.get(window.wallId);
    if (!wall) {
      errors.push({
        id: `err_${windowId}_no_wall`,
        type: 'window_no_wall',
        level: 'error',
        message: '窗户所在墙体不存在',
        elementId: windowId,
        autoFixable: false,
      });
      return;
    }
    
    const wallLength = getWallLength(wall, vertices);
    
    if (window.width >= wallLength) {
      errors.push({
        id: `err_${windowId}_too_wide`,
        type: 'window_too_wide',
        level: 'error',
        message: '窗户宽度超过墙体长度',
        elementId: windowId,
        autoFixable: true,
      });
    }
    
    const windowStart = window.position * wallLength - window.width / 2;
    const windowEnd = window.position * wallLength + window.width / 2;
    
    if (windowStart < MIN_DISTANCE || wallLength - windowEnd < MIN_DISTANCE) {
      errors.push({
        id: `err_${windowId}_out_of_wall`,
        type: 'window_out_of_wall',
        level: 'warning',
        message: '窗户距离墙体端点太近',
        elementId: windowId,
        autoFixable: true,
      });
    }
  });
  
  return errors;
}

/**
 * L2 - 空间语义规则（Smart Home Core）
 */
function validateL2Rules(
  vertices: Map<string, Vertex>,
  _walls: Map<string, Wall>,
  rooms: Map<string, Room>
): EditorError[] {
  const errors: EditorError[] = [];
  
  // L2-2 Room不重叠检查
  const roomArray = Array.from(rooms.entries());
  for (let i = 0; i < roomArray.length; i++) {
    for (let j = i + 1; j < roomArray.length; j++) {
      const [id1, room1] = roomArray[i];
      const [id2, room2] = roomArray[j];
      
      const poly1 = room1.vertexIds
        .map(id => vertices.get(id))
        .filter((v): v is Vertex => v !== undefined);
      const poly2 = room2.vertexIds
        .map(id => vertices.get(id))
        .filter((v): v is Vertex => v !== undefined);
      
      if (poly1.length >= 3 && poly2.length >= 3) {
        if (doPolygonsOverlap(poly1, poly2)) {
          errors.push({
            id: `err_${id1}_${id2}_overlap`,
            type: 'room_overlap',
            level: 'warning',
            message: `房间 "${room1.name}" 与 "${room2.name}" 存在重叠`,
            elementId: id1,
            autoFixable: false,
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * 检查两条线段是否相交（不包括端点）
 */
function doSegmentsIntersect(
  p1: Point, p2: Point, p3: Point, p4: Point
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

function direction(p1: Point, p2: Point, p3: Point): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

// ============ L3 自动修复功能 ============

/**
 * L3-1 自动吸附 - 墙端点接近时自动吸附
 */
export function autoSnapVertex(
  point: Point,
  vertices: Map<string, Vertex>,
  excludeId?: string
): Point {
  const snapDistance = EDITOR_CONFIG.SNAP_DISTANCE;
  let nearestPoint = point;
  let minDistance = snapDistance;
  
  vertices.forEach((vertex, id) => {
    if (id === excludeId) return;
    const distance = Math.sqrt(
      Math.pow(vertex.x - point.x, 2) + Math.pow(vertex.y - point.y, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = { x: vertex.x, y: vertex.y };
    }
  });
  
  return nearestPoint;
}

/**
 * L3-2 自动闭合修复 - 闭合差值小于阈值时自动补齐
 */
export function autoCloseWall(
  startVertexId: string,
  endPoint: Point,
  vertices: Map<string, Vertex>
): string | null {
  const startVertex = vertices.get(startVertexId);
  if (!startVertex) return null;
  
  const distance = Math.sqrt(
    Math.pow(startVertex.x - endPoint.x, 2) + 
    Math.pow(startVertex.y - endPoint.y, 2)
  );
  
  if (distance < EDITOR_CONFIG.AUTO_CLOSE_THRESHOLD) {
    return startVertexId; // 返回起点ID，表示应该闭合
  }
  
  return null;
}

/**
 * L3-4 门窗纠偏 - 门/窗靠近墙端点时自动滑动
 */
export function autoCorrectDoorWindowPosition(
  position: number,
  width: number,
  wallLength: number
): number {
  const minDistance = EDITOR_CONFIG.DOOR_WINDOW_MIN_DISTANCE;
  const minPos = (minDistance + width / 2) / wallLength;
  const maxPos = 1 - minPos;
  
  return Math.max(minPos, Math.min(maxPos, position));
}

// ============ L4 智能家居增强 ============

/**
 * L4-1 默认Room类型推断
 */
export function inferRoomType(
  room: Room,
  vertices: Map<string, Vertex>,
  doors: Map<string, Door>,
  walls: Map<string, Wall>
): Room['type'] {
  const points = room.vertexIds
    .map(id => vertices.get(id))
    .filter((v): v is Vertex => v !== undefined);
  
  if (points.length < 3) return 'unknown';
  
  const area = calculatePolygonArea(points);
  const areaSqm = area / 10000; // 转换为平方米
  
  // 统计房间的门数量
  const roomWallIds = new Set<string>();
  walls.forEach((wall, wallId) => {
    const hasStart = room.vertexIds.includes(wall.startVertexId);
    const hasEnd = room.vertexIds.includes(wall.endVertexId);
    if (hasStart && hasEnd) {
      roomWallIds.add(wallId);
    }
  });
  
  let doorCount = 0;
  doors.forEach(door => {
    if (roomWallIds.has(door.wallId)) {
      doorCount++;
    }
  });
  
  // 基于面积和门数推断
  if (areaSqm < 4) {
    return doorCount === 0 ? 'storage' : 'bathroom';
  } else if (areaSqm < 8) {
    return 'bedroom';
  } else if (areaSqm < 15) {
    return doorCount >= 2 ? 'living_room' : 'bedroom';
  } else {
    return 'living_room';
  }
}

/**
 * 获取房间类型的中文名称
 */
export function getRoomTypeName(type: Room['type']): string {
  const names: Record<NonNullable<Room['type']>, string> = {
    living_room: '客厅',
    bedroom: '卧室',
    bathroom: '卫生间',
    kitchen: '厨房',
    balcony: '阳台',
    storage: '储物间',
    corridor: '走廊',
    unknown: '未知',
  };
  return names[type || 'unknown'];
}
