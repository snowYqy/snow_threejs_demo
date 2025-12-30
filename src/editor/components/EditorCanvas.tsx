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

export const EditorCanvas: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapVertex, setSnapVertex] = useState<Vertex | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  
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
    return stage.getPointerPosition();
  }, []);

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

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height}
        onMouseMove={handlePointerMove} onTouchMove={handlePointerMove}
        onClick={handleClick} onTap={handleClick}
        style={{ backgroundColor: '#fafafa' }}>
        <GridLayer width={canvasSize.width} height={canvasSize.height} />
        <RoomLayer rooms={rooms} vertices={vertices} selectedIds={selectedIds} />
        <WallLayer walls={walls} vertices={vertices} errors={errors} selectedIds={selectedIds} hoveredId={hoveredId}
          onVertexDragMove={handleVertexDragMove} onVertexDragEnd={handleVertexDragEnd}
          onWallClick={(id) => setSelectedIds([id])} onVertexClick={(id) => setSelectedIds([id])} />
        <DoorWindowLayer doors={doors} windows={windows} walls={walls} vertices={vertices} errors={errors}
          selectedIds={selectedIds} hoveredId={hoveredId}
          onDoorClick={(id) => setSelectedIds([id])} onWindowClick={(id) => setSelectedIds([id])} />
        <InteractionLayer drawingVertexId={drawingVertexId} previewPoint={previewPoint} vertices={vertices} snapVertex={snapVertex} />
      </Stage>
    </div>
  );
};
