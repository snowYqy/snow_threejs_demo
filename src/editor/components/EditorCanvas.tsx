import { useRef, useCallback, useState, useEffect } from 'react';
import { Stage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../store/useEditorStore';
import { findNearestVertex, pointToLineDistance } from '../engine/geometry';
import type { Vertex } from '../types';

import { GridLayer } from './layers/GridLayer';
import { RoomLayer } from './layers/RoomLayer';
import { WallLayer } from './layers/WallLayer';
import { DoorWindowLayer } from './layers/DoorWindowLayer';
import { InteractionLayer } from './layers/InteractionLayer';

const SNAP_DISTANCE = 15;
const WALL_HIT_DISTANCE = 15;

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const SCALE_STEP = 0.1;

export const EditorCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapVertex, setSnapVertex] = useState<Vertex | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const {
    vertices, walls, rooms, doors, windows, errors, activeTool, selectedIds, hoveredId,
    drawingVertexId, previewPoint, addVertex, addWall, deleteWall, deleteVertex,
    addDoor, addWindow, deleteDoor, deleteWindow, moveVertex, setSelectedIds,
    setHoveredId, setDrawingVertexId, setPreviewPoint, cancelDrawing,
  } = useEditorStore();

  // Responsive canvas size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;
    // 转换为画布坐标（考虑缩放和平移）
    return {
      x: (pointerPos.x - position.x) / scale,
      y: (pointerPos.y - position.y) / scale,
    };
  }, [scale, position]);

  const findWallAtPosition = useCallback((x: number, y: number): string | null => {
    let nearestWallId: string | null = null;
    let minDistance = WALL_HIT_DISTANCE;
    walls.forEach((wall, wallId) => {
      const startVertex = vertices.get(wall.startVertexId);
      const endVertex = vertices.get(wall.endVertexId);
      if (!startVertex || !endVertex) return;
      const distance = pointToLineDistance({ x, y }, startVertex, endVertex);
      if (distance < minDistance) { minDistance = distance; nearestWallId = wallId; }
    });
    return nearestWallId;
  }, [walls, vertices]);

  const handlePointerMove = useCallback(() => {
    const pos = getPointerPosition();
    if (!pos) return;
    if (activeTool === 'drawWall' && drawingVertexId) {
      setPreviewPoint(pos);
      const nearestId = findNearestVertex(pos, vertices, SNAP_DISTANCE);
      setSnapVertex(nearestId ? vertices.get(nearestId) || null : null);
    }
    if (activeTool === 'select' || activeTool === 'delete') {
      const nearestVertexId = findNearestVertex(pos, vertices, SNAP_DISTANCE);
      setHoveredId(nearestVertexId || findWallAtPosition(pos.x, pos.y));
    }
    if (activeTool === 'door' || activeTool === 'window') {
      setHoveredId(findWallAtPosition(pos.x, pos.y));
    }
  }, [activeTool, drawingVertexId, vertices, getPointerPosition, findWallAtPosition, setPreviewPoint, setHoveredId]);

  const handleClick = useCallback(() => {
    const pos = getPointerPosition();
    if (!pos) return;
    switch (activeTool) {
      case 'drawWall': {
        const nearestId = findNearestVertex(pos, vertices, SNAP_DISTANCE);
        if (drawingVertexId) {
          const endVertexId = nearestId || addVertex(pos.x, pos.y);
          addWall(drawingVertexId, endVertexId);
          setDrawingVertexId(endVertexId);
          setSnapVertex(null);
        } else {
          setDrawingVertexId(nearestId || addVertex(pos.x, pos.y));
        }
        break;
      }
      case 'select': {
        const nearestVertexId = findNearestVertex(pos, vertices, SNAP_DISTANCE);
        if (nearestVertexId) setSelectedIds([nearestVertexId]);
        else { const wallId = findWallAtPosition(pos.x, pos.y); setSelectedIds(wallId ? [wallId] : []); }
        break;
      }
      case 'delete': {
        const nearestVertexId = findNearestVertex(pos, vertices, SNAP_DISTANCE);
        if (nearestVertexId) deleteVertex(nearestVertexId);
        else { const wallId = findWallAtPosition(pos.x, pos.y); if (wallId) deleteWall(wallId); }
        break;
      }
      case 'door':
      case 'window': {
        const wallId = findWallAtPosition(pos.x, pos.y);
        if (wallId) {
          const wall = walls.get(wallId);
          if (wall) {
            const sv = vertices.get(wall.startVertexId), ev = vertices.get(wall.endVertexId);
            if (sv && ev) {
              const dx = ev.x - sv.x, dy = ev.y - sv.y, len = Math.sqrt(dx*dx + dy*dy);
              const position = Math.max(0.1, Math.min(0.9, ((pos.x - sv.x) * dx + (pos.y - sv.y) * dy) / (len * len)));
              activeTool === 'door' ? addDoor(wallId, position) : addWindow(wallId, position);
            }
          }
        }
        break;
      }
    }
  }, [activeTool, drawingVertexId, vertices, walls, getPointerPosition, findWallAtPosition, addVertex, addWall, deleteWall, deleteVertex, addDoor, addWindow, setDrawingVertexId, setSelectedIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { cancelDrawing(); setSelectedIds([]); setSnapVertex(null); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach(id => {
          if (vertices.has(id)) deleteVertex(id);
          else if (walls.has(id)) deleteWall(id);
          else if (doors.has(id)) deleteDoor(id);
          else if (windows.has(id)) deleteWindow(id);
        });
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, vertices, walls, doors, windows, cancelDrawing, deleteVertex, deleteWall, deleteDoor, deleteWindow, setSelectedIds]);

  const handleVertexDragMove = useCallback((id: string, x: number, y: number) => moveVertex(id, x, y), [moveVertex]);
  const handleVertexDragEnd = useCallback((id: string, x: number, y: number) => {
    const nearestId = findNearestVertex({ x, y }, vertices, SNAP_DISTANCE);
    if (nearestId && nearestId !== id) {
      const nearestVertex = vertices.get(nearestId);
      if (nearestVertex) moveVertex(id, nearestVertex.x, nearestVertex.y);
    }
  }, [vertices, moveVertex]);

  // 缩放处理
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale + direction * SCALE_STEP));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setPosition(newPos);
  }, [scale, position]);

  // 拖拽画布（按住空格或中键）
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 触摸手势状态
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  const [isTouchPanning, setIsTouchPanning] = useState(false);

  // 计算两点之间的距离
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 计算两点的中心
  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // 中键拖拽
    if ('button' in e.evt && e.evt.button === 1) {
      setIsDragging(true);
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) setDragStart({ x: pointer.x - position.x, y: pointer.y - position.y });
      }
    }
  }, [position]);

  const handleDragMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDragging) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (pointer) {
      setPosition({ x: pointer.x - dragStart.x, y: pointer.y - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 触摸开始
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    
    if (touches.length === 2) {
      // 双指：准备缩放和平移
      e.evt.preventDefault();
      setLastTouchDistance(getTouchDistance(touches));
      setLastTouchCenter(getTouchCenter(touches));
      setIsTouchPanning(true);
    } else if (touches.length === 1) {
      // 单指：准备拖动画布
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const touchX = touches[0].clientX - rect.left;
        const touchY = touches[0].clientY - rect.top;
        setDragStart({ x: touchX - position.x, y: touchY - position.y });
        setIsTouchPanning(true);
      }
    }
  }, [position]);

  // 触摸移动
  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    
    if (touches.length === 2 && lastTouchDistance !== null && lastTouchCenter !== null) {
      // 双指缩放和平移
      e.evt.preventDefault();
      
      const newDistance = getTouchDistance(touches);
      const newCenter = getTouchCenter(touches);
      
      // 计算缩放
      const scaleChange = newDistance / lastTouchDistance;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * scaleChange));
      
      // 计算平移（基于中心点移动）
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const centerX = newCenter.x - rect.left;
        const centerY = newCenter.y - rect.top;
        const lastCenterX = lastTouchCenter.x - rect.left;
        const lastCenterY = lastTouchCenter.y - rect.top;
        
        // 缩放中心点
        const pointTo = {
          x: (centerX - position.x) / scale,
          y: (centerY - position.y) / scale,
        };
        
        const newPos = {
          x: centerX - pointTo.x * newScale + (centerX - lastCenterX),
          y: centerY - pointTo.y * newScale + (centerY - lastCenterY),
        };
        
        setScale(newScale);
        setPosition(newPos);
      }
      
      setLastTouchDistance(newDistance);
      setLastTouchCenter(newCenter);
    } else if (touches.length === 1 && isTouchPanning) {
      // 单指拖动画布
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const touchX = touches[0].clientX - rect.left;
        const touchY = touches[0].clientY - rect.top;
        setPosition({ x: touchX - dragStart.x, y: touchY - dragStart.y });
      }
    }
    
    // 同时处理指针移动（用于工具交互）
    handlePointerMove();
  }, [lastTouchDistance, lastTouchCenter, scale, position, isTouchPanning, dragStart, handlePointerMove]);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    setLastTouchDistance(null);
    setLastTouchCenter(null);
    setIsTouchPanning(false);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height}
        scaleX={scale} scaleY={scale} x={position.x} y={position.y}
        onClick={handleClick} onTap={handleClick}
        onWheel={handleWheel}
        onMouseDown={handleDragStart}
        onMouseMove={(e) => { handlePointerMove(); handleDragMove(e); }}
        onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ backgroundColor: '#fafafa', cursor: isDragging ? 'grabbing' : 'default' }}>
        <GridLayer width={canvasSize.width / scale} height={canvasSize.height / scale} />
        <RoomLayer rooms={rooms} vertices={vertices} selectedIds={selectedIds} />
        <WallLayer walls={walls} vertices={vertices} errors={errors} selectedIds={selectedIds} hoveredId={hoveredId}
          onVertexDragMove={handleVertexDragMove} onVertexDragEnd={handleVertexDragEnd}
          onWallClick={(id) => setSelectedIds([id])} onVertexClick={(id) => setSelectedIds([id])} />
        <DoorWindowLayer doors={doors} windows={windows} walls={walls} vertices={vertices} errors={errors}
          selectedIds={selectedIds} hoveredId={hoveredId}
          onDoorClick={(id) => setSelectedIds([id])} onWindowClick={(id) => setSelectedIds([id])} />
        <InteractionLayer drawingVertexId={drawingVertexId} previewPoint={previewPoint} vertices={vertices} snapVertex={snapVertex} />
      </Stage>
      {/* 缩放控制按钮 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-md p-2">
        <button
          onClick={() => setScale(Math.min(MAX_SCALE, scale + SCALE_STEP))}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-lg font-bold"
          title="放大"
        >+</button>
        <span className="text-xs text-center text-gray-600">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(Math.max(MIN_SCALE, scale - SCALE_STEP))}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-lg font-bold"
          title="缩小"
        >−</button>
        <button
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs"
          title="重置"
        >1:1</button>
      </div>
    </div>
  );
};
