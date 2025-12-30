import { create } from 'zustand';
import type { Vertex, Wall, Room, Door, Window, ToolType, EditorError } from '../types';
import { findAllCycles, buildGraph } from '../engine/geometry';
import { validateAll } from '../engine/rules';
import type { FloorPlanPreset } from '../data/presets';

// Room colors palette
const ROOM_COLORS = [
  'rgba(255, 182, 193, 0.4)', // Light pink
  'rgba(173, 216, 230, 0.4)', // Light blue
  'rgba(144, 238, 144, 0.4)', // Light green
  'rgba(255, 218, 185, 0.4)', // Peach
  'rgba(221, 160, 221, 0.4)', // Plum
  'rgba(176, 224, 230, 0.4)', // Powder blue
  'rgba(255, 255, 224, 0.4)', // Light yellow
  'rgba(230, 230, 250, 0.4)', // Lavender
];

let colorIndex = 0;
const getNextColor = () => {
  const color = ROOM_COLORS[colorIndex % ROOM_COLORS.length];
  colorIndex++;
  return color;
};

interface EditorState {
  // Data
  vertices: Map<string, Vertex>;
  walls: Map<string, Wall>;
  rooms: Map<string, Room>;
  doors: Map<string, Door>;
  windows: Map<string, Window>;
  
  // UI State
  activeTool: ToolType;
  selectedIds: string[];
  hoveredId: string | null;
  errors: EditorError[];
  
  // Drawing State
  drawingVertexId: string | null;
  previewPoint: { x: number; y: number } | null;
  
  // Canvas State
  scale: number;
  offset: { x: number; y: number };
  
  // Actions
  setActiveTool: (tool: ToolType) => void;
  addVertex: (x: number, y: number) => string;
  addWall: (startId: string, endId: string) => string;
  deleteWall: (id: string) => void;
  deleteVertex: (id: string) => void;
  addDoor: (wallId: string, position: number) => void;
  addWindow: (wallId: string, position: number) => void;
  deleteDoor: (id: string) => void;
  deleteWindow: (id: string) => void;
  moveVertex: (id: string, x: number, y: number) => void;
  
  // Selection
  setSelectedIds: (ids: string[]) => void;
  setHoveredId: (id: string | null) => void;
  
  // Drawing
  setDrawingVertexId: (id: string | null) => void;
  setPreviewPoint: (point: { x: number; y: number } | null) => void;
  cancelDrawing: () => void;
  
  // Canvas
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  
  // Preset
  loadPreset: (preset: FloorPlanPreset) => void;
  clearAll: () => void;
  
  // Computed
  recalculateRooms: () => void;
  validateAllData: () => void;
  
  // Utility
  getVertexById: (id: string) => Vertex | undefined;
  getWallById: (id: string) => Wall | undefined;
}

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${++idCounter}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial Data
  vertices: new Map(),
  walls: new Map(),
  rooms: new Map(),
  doors: new Map(),
  windows: new Map(),
  
  // Initial UI State
  activeTool: 'select',
  selectedIds: [],
  hoveredId: null,
  errors: [],
  
  // Initial Drawing State
  drawingVertexId: null,
  previewPoint: null,
  
  // Initial Canvas State
  scale: 1,
  offset: { x: 0, y: 0 },
  
  // Actions
  setActiveTool: (tool) => {
    set({ activeTool: tool, drawingVertexId: null, previewPoint: null });
  },
  
  addVertex: (x, y) => {
    const id = generateId('v');
    const vertex: Vertex = { id, x, y };
    set((state) => {
      const newVertices = new Map(state.vertices);
      newVertices.set(id, vertex);
      return { vertices: newVertices };
    });
    return id;
  },
  
  addWall: (startId, endId) => {
    const id = generateId('w');
    const wall: Wall = { id, startVertexId: startId, endVertexId: endId, thickness: 10 };
    set((state) => {
      const newWalls = new Map(state.walls);
      newWalls.set(id, wall);
      return { walls: newWalls };
    });
    // Recalculate rooms after adding wall
    setTimeout(() => {
      get().recalculateRooms();
      get().validateAllData();
    }, 0);
    return id;
  },
  
  deleteWall: (id) => {
    set((state) => {
      const newWalls = new Map(state.walls);
      const wall = newWalls.get(id);
      newWalls.delete(id);
      
      // Delete doors and windows on this wall
      const newDoors = new Map(state.doors);
      const newWindows = new Map(state.windows);
      state.doors.forEach((door, doorId) => {
        if (door.wallId === id) newDoors.delete(doorId);
      });
      state.windows.forEach((window, windowId) => {
        if (window.wallId === id) newWindows.delete(windowId);
      });
      
      // Check for orphan vertices
      const newVertices = new Map(state.vertices);
      if (wall) {
        const startUsed = Array.from(newWalls.values()).some(
          w => w.startVertexId === wall.startVertexId || w.endVertexId === wall.startVertexId
        );
        const endUsed = Array.from(newWalls.values()).some(
          w => w.startVertexId === wall.endVertexId || w.endVertexId === wall.endVertexId
        );
        if (!startUsed) newVertices.delete(wall.startVertexId);
        if (!endUsed) newVertices.delete(wall.endVertexId);
      }
      
      return { walls: newWalls, doors: newDoors, windows: newWindows, vertices: newVertices };
    });
    setTimeout(() => {
      get().recalculateRooms();
      get().validateAllData();
    }, 0);
  },
  
  deleteVertex: (id) => {
    set((state) => {
      // Find and delete all walls connected to this vertex
      const wallsToDelete: string[] = [];
      state.walls.forEach((wall, wallId) => {
        if (wall.startVertexId === id || wall.endVertexId === id) {
          wallsToDelete.push(wallId);
        }
      });
      
      const newWalls = new Map(state.walls);
      const newDoors = new Map(state.doors);
      const newWindows = new Map(state.windows);
      
      wallsToDelete.forEach(wallId => {
        newWalls.delete(wallId);
        // Delete doors and windows on deleted walls
        state.doors.forEach((door, doorId) => {
          if (door.wallId === wallId) newDoors.delete(doorId);
        });
        state.windows.forEach((window, windowId) => {
          if (window.wallId === wallId) newWindows.delete(windowId);
        });
      });
      
      const newVertices = new Map(state.vertices);
      newVertices.delete(id);
      
      return { vertices: newVertices, walls: newWalls, doors: newDoors, windows: newWindows };
    });
    setTimeout(() => {
      get().recalculateRooms();
      get().validateAllData();
    }, 0);
  },
  
  addDoor: (wallId, position) => {
    const id = generateId('d');
    const door: Door = { id, wallId, position, width: 40, direction: 'left' };
    set((state) => {
      const newDoors = new Map(state.doors);
      newDoors.set(id, door);
      return { doors: newDoors };
    });
    get().validateAllData();
  },
  
  addWindow: (wallId, position) => {
    const id = generateId('win');
    const window: Window = { id, wallId, position, width: 60, height: 40 };
    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.set(id, window);
      return { windows: newWindows };
    });
    get().validateAllData();
  },
  
  deleteDoor: (id) => {
    set((state) => {
      const newDoors = new Map(state.doors);
      newDoors.delete(id);
      return { doors: newDoors };
    });
  },
  
  deleteWindow: (id) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.delete(id);
      return { windows: newWindows };
    });
  },
  
  moveVertex: (id, x, y) => {
    set((state) => {
      const newVertices = new Map(state.vertices);
      const vertex = newVertices.get(id);
      if (vertex) {
        newVertices.set(id, { ...vertex, x, y });
      }
      return { vertices: newVertices };
    });
    setTimeout(() => {
      get().recalculateRooms();
      get().validateAllData();
    }, 0);
  },
  
  // Selection
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setHoveredId: (id) => set({ hoveredId: id }),
  
  // Drawing
  setDrawingVertexId: (id) => set({ drawingVertexId: id }),
  setPreviewPoint: (point) => set({ previewPoint: point }),
  cancelDrawing: () => set({ drawingVertexId: null, previewPoint: null }),
  
  // Canvas
  setScale: (scale) => set({ scale }),
  setOffset: (offset) => set({ offset }),
  
  // Preset
  loadPreset: (preset) => {
    const newVertices = new Map<string, Vertex>();
    const newWalls = new Map<string, Wall>();
    const newDoors = new Map<string, Door>();
    const newWindows = new Map<string, Window>();
    
    preset.vertices.forEach(v => newVertices.set(v.id, { ...v }));
    preset.walls.forEach(w => newWalls.set(w.id, { ...w }));
    preset.doors.forEach(d => newDoors.set(d.id, { ...d }));
    preset.windows.forEach(w => newWindows.set(w.id, { ...w }));
    
    set({
      vertices: newVertices,
      walls: newWalls,
      doors: newDoors,
      windows: newWindows,
      rooms: new Map(),
      selectedIds: [],
      hoveredId: null,
      drawingVertexId: null,
      previewPoint: null,
      errors: [],
    });
    
    // Recalculate rooms after loading
    setTimeout(() => {
      get().recalculateRooms();
      get().validateAllData();
    }, 0);
  },
  
  clearAll: () => {
    set({
      vertices: new Map(),
      walls: new Map(),
      rooms: new Map(),
      doors: new Map(),
      windows: new Map(),
      selectedIds: [],
      hoveredId: null,
      drawingVertexId: null,
      previewPoint: null,
      errors: [],
    });
  },
  
  // Computed
  recalculateRooms: () => {
    const state = get();
    const graph = buildGraph(state.vertices, state.walls);
    const cycles = findAllCycles(graph, state.vertices);
    
    colorIndex = 0;
    const newRooms = new Map<string, Room>();
    cycles.forEach((cycle, index) => {
      const roomId = generateId('r');
      newRooms.set(roomId, {
        id: roomId,
        vertexIds: cycle,
        color: getNextColor(),
        name: `房间 ${index + 1}`,
      });
    });
    
    set({ rooms: newRooms });
  },
  
  validateAllData: () => {
    const state = get();
    const errors = validateAll(
      state.vertices,
      state.walls,
      state.rooms,
      state.doors,
      state.windows
    );
    set({ errors });
  },
  
  // Utility
  getVertexById: (id) => get().vertices.get(id),
  getWallById: (id) => get().walls.get(id),
}));
