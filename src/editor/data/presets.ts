import type { Vertex, Wall, Door, Window } from '../types';

export interface FloorPlanPreset {
  id: string;
  name: string;
  description: string;
  vertices: Vertex[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
}

// 一室一厅户型
const oneBedroomPreset: FloorPlanPreset = {
  id: 'one-bedroom',
  name: '一室一厅',
  description: '约50㎡，适合单身或情侣',
  vertices: [
    // 外墙顶点
    { id: 'v1', x: 100, y: 100 },
    { id: 'v2', x: 500, y: 100 },
    { id: 'v3', x: 500, y: 450 },
    { id: 'v4', x: 100, y: 450 },
    // 内墙顶点
    { id: 'v5', x: 300, y: 100 },
    { id: 'v6', x: 300, y: 300 },
    { id: 'v7', x: 100, y: 300 },
    { id: 'v8', x: 500, y: 300 },
  ],
  walls: [
    // 外墙
    { id: 'w1', startVertexId: 'v1', endVertexId: 'v2', thickness: 10 },
    { id: 'w2', startVertexId: 'v2', endVertexId: 'v3', thickness: 10 },
    { id: 'w3', startVertexId: 'v3', endVertexId: 'v4', thickness: 10 },
    { id: 'w4', startVertexId: 'v4', endVertexId: 'v1', thickness: 10 },
    // 内墙 - 卧室与客厅分隔
    { id: 'w5', startVertexId: 'v5', endVertexId: 'v6', thickness: 8 },
    { id: 'w6', startVertexId: 'v6', endVertexId: 'v7', thickness: 8 },
    // 内墙 - 卫生间
    { id: 'w7', startVertexId: 'v6', endVertexId: 'v8', thickness: 8 },
  ],
  doors: [
    { id: 'd1', wallId: 'w5', position: 0.7, width: 40, direction: 'left' },
    { id: 'd2', wallId: 'w7', position: 0.3, width: 35, direction: 'right' },
  ],
  windows: [
    { id: 'win1', wallId: 'w1', position: 0.3, width: 60, height: 40 },
    { id: 'win2', wallId: 'w3', position: 0.5, width: 80, height: 40 },
  ],
};

// 两室一厅户型
const twoBedroomPreset: FloorPlanPreset = {
  id: 'two-bedroom',
  name: '两室一厅',
  description: '约80㎡，适合小家庭',
  vertices: [
    // 外墙
    { id: 'v1', x: 100, y: 100 },
    { id: 'v2', x: 600, y: 100 },
    { id: 'v3', x: 600, y: 500 },
    { id: 'v4', x: 100, y: 500 },
    // 内墙顶点
    { id: 'v5', x: 350, y: 100 },
    { id: 'v6', x: 350, y: 320 },
    { id: 'v7', x: 100, y: 320 },
    { id: 'v8', x: 350, y: 500 },
    { id: 'v9', x: 600, y: 320 },
    { id: 'v10', x: 480, y: 320 },
    { id: 'v11', x: 480, y: 500 },
  ],
  walls: [
    // 外墙
    { id: 'w1', startVertexId: 'v1', endVertexId: 'v2', thickness: 10 },
    { id: 'w2', startVertexId: 'v2', endVertexId: 'v3', thickness: 10 },
    { id: 'w3', startVertexId: 'v3', endVertexId: 'v4', thickness: 10 },
    { id: 'w4', startVertexId: 'v4', endVertexId: 'v1', thickness: 10 },
    // 主卧分隔
    { id: 'w5', startVertexId: 'v5', endVertexId: 'v6', thickness: 8 },
    { id: 'w6', startVertexId: 'v6', endVertexId: 'v7', thickness: 8 },
    // 次卧分隔
    { id: 'w7', startVertexId: 'v6', endVertexId: 'v8', thickness: 8 },
    // 卫生间/厨房分隔
    { id: 'w8', startVertexId: 'v6', endVertexId: 'v10', thickness: 8 },
    { id: 'w9', startVertexId: 'v10', endVertexId: 'v9', thickness: 8 },
    { id: 'w10', startVertexId: 'v10', endVertexId: 'v11', thickness: 8 },
  ],
  doors: [
    { id: 'd1', wallId: 'w5', position: 0.6, width: 40, direction: 'left' },
    { id: 'd2', wallId: 'w7', position: 0.4, width: 40, direction: 'right' },
    { id: 'd3', wallId: 'w8', position: 0.5, width: 35, direction: 'left' },
    { id: 'd4', wallId: 'w10', position: 0.5, width: 35, direction: 'right' },
  ],
  windows: [
    { id: 'win1', wallId: 'w1', position: 0.25, width: 60, height: 40 },
    { id: 'win2', wallId: 'w1', position: 0.75, width: 60, height: 40 },
    { id: 'win3', wallId: 'w3', position: 0.3, width: 80, height: 40 },
    { id: 'win4', wallId: 'w2', position: 0.5, width: 60, height: 40 },
  ],
};

// 三室两厅户型
const threeBedroomPreset: FloorPlanPreset = {
  id: 'three-bedroom',
  name: '三室两厅',
  description: '约120㎡，适合大家庭',
  vertices: [
    // 外墙
    { id: 'v1', x: 100, y: 80 },
    { id: 'v2', x: 700, y: 80 },
    { id: 'v3', x: 700, y: 550 },
    { id: 'v4', x: 100, y: 550 },
    // 内墙顶点
    { id: 'v5', x: 280, y: 80 },
    { id: 'v6', x: 280, y: 280 },
    { id: 'v7', x: 100, y: 280 },
    { id: 'v8', x: 480, y: 80 },
    { id: 'v9', x: 480, y: 280 },
    { id: 'v10', x: 700, y: 280 },
    { id: 'v11', x: 280, y: 550 },
    { id: 'v12', x: 280, y: 400 },
    { id: 'v13', x: 100, y: 400 },
    { id: 'v14', x: 480, y: 400 },
    { id: 'v15', x: 480, y: 550 },
    { id: 'v16', x: 580, y: 280 },
    { id: 'v17', x: 580, y: 400 },
    { id: 'v18', x: 700, y: 400 },
  ],
  walls: [
    // 外墙
    { id: 'w1', startVertexId: 'v1', endVertexId: 'v2', thickness: 10 },
    { id: 'w2', startVertexId: 'v2', endVertexId: 'v3', thickness: 10 },
    { id: 'w3', startVertexId: 'v3', endVertexId: 'v4', thickness: 10 },
    { id: 'w4', startVertexId: 'v4', endVertexId: 'v1', thickness: 10 },
    // 主卧
    { id: 'w5', startVertexId: 'v5', endVertexId: 'v6', thickness: 8 },
    { id: 'w6', startVertexId: 'v6', endVertexId: 'v7', thickness: 8 },
    // 次卧1
    { id: 'w7', startVertexId: 'v8', endVertexId: 'v9', thickness: 8 },
    { id: 'w8', startVertexId: 'v6', endVertexId: 'v9', thickness: 8 },
    // 次卧2
    { id: 'w9', startVertexId: 'v12', endVertexId: 'v13', thickness: 8 },
    { id: 'w10', startVertexId: 'v12', endVertexId: 'v11', thickness: 8 },
    // 客厅/餐厅分隔
    { id: 'w11', startVertexId: 'v12', endVertexId: 'v14', thickness: 8 },
    { id: 'w12', startVertexId: 'v14', endVertexId: 'v15', thickness: 8 },
    // 卫生间/厨房
    { id: 'w13', startVertexId: 'v9', endVertexId: 'v16', thickness: 8 },
    { id: 'w14', startVertexId: 'v16', endVertexId: 'v10', thickness: 8 },
    { id: 'w15', startVertexId: 'v16', endVertexId: 'v17', thickness: 8 },
    { id: 'w16', startVertexId: 'v17', endVertexId: 'v18', thickness: 8 },
    { id: 'w17', startVertexId: 'v14', endVertexId: 'v17', thickness: 8 },
  ],
  doors: [
    { id: 'd1', wallId: 'w5', position: 0.6, width: 40, direction: 'left' },
    { id: 'd2', wallId: 'w7', position: 0.6, width: 40, direction: 'right' },
    { id: 'd3', wallId: 'w10', position: 0.5, width: 40, direction: 'left' },
    { id: 'd4', wallId: 'w13', position: 0.5, width: 35, direction: 'left' },
    { id: 'd5', wallId: 'w15', position: 0.5, width: 35, direction: 'right' },
  ],
  windows: [
    { id: 'win1', wallId: 'w1', position: 0.2, width: 60, height: 40 },
    { id: 'win2', wallId: 'w1', position: 0.5, width: 60, height: 40 },
    { id: 'win3', wallId: 'w1', position: 0.8, width: 60, height: 40 },
    { id: 'win4', wallId: 'w3', position: 0.3, width: 100, height: 40 },
    { id: 'win5', wallId: 'w3', position: 0.7, width: 80, height: 40 },
    { id: 'win6', wallId: 'w2', position: 0.7, width: 60, height: 40 },
  ],
};

// 简单方形房间（用于测试）
const simpleRoomPreset: FloorPlanPreset = {
  id: 'simple-room',
  name: '简单房间',
  description: '单个方形房间，适合快速测试',
  vertices: [
    { id: 'v1', x: 200, y: 150 },
    { id: 'v2', x: 500, y: 150 },
    { id: 'v3', x: 500, y: 400 },
    { id: 'v4', x: 200, y: 400 },
  ],
  walls: [
    { id: 'w1', startVertexId: 'v1', endVertexId: 'v2', thickness: 10 },
    { id: 'w2', startVertexId: 'v2', endVertexId: 'v3', thickness: 10 },
    { id: 'w3', startVertexId: 'v3', endVertexId: 'v4', thickness: 10 },
    { id: 'w4', startVertexId: 'v4', endVertexId: 'v1', thickness: 10 },
  ],
  doors: [
    { id: 'd1', wallId: 'w4', position: 0.5, width: 40, direction: 'right' },
  ],
  windows: [
    { id: 'win1', wallId: 'w1', position: 0.5, width: 80, height: 40 },
    { id: 'win2', wallId: 'w2', position: 0.5, width: 60, height: 40 },
  ],
};

// L型户型
const lShapePreset: FloorPlanPreset = {
  id: 'l-shape',
  name: 'L型户型',
  description: '约70㎡，L型布局',
  vertices: [
    { id: 'v1', x: 100, y: 100 },
    { id: 'v2', x: 400, y: 100 },
    { id: 'v3', x: 400, y: 250 },
    { id: 'v4', x: 550, y: 250 },
    { id: 'v5', x: 550, y: 500 },
    { id: 'v6', x: 100, y: 500 },
    // 内墙
    { id: 'v7', x: 250, y: 100 },
    { id: 'v8', x: 250, y: 350 },
    { id: 'v9', x: 100, y: 350 },
    { id: 'v10', x: 400, y: 350 },
    { id: 'v11', x: 400, y: 500 },
  ],
  walls: [
    // 外墙
    { id: 'w1', startVertexId: 'v1', endVertexId: 'v2', thickness: 10 },
    { id: 'w2', startVertexId: 'v2', endVertexId: 'v3', thickness: 10 },
    { id: 'w3', startVertexId: 'v3', endVertexId: 'v4', thickness: 10 },
    { id: 'w4', startVertexId: 'v4', endVertexId: 'v5', thickness: 10 },
    { id: 'w5', startVertexId: 'v5', endVertexId: 'v6', thickness: 10 },
    { id: 'w6', startVertexId: 'v6', endVertexId: 'v1', thickness: 10 },
    // 内墙
    { id: 'w7', startVertexId: 'v7', endVertexId: 'v8', thickness: 8 },
    { id: 'w8', startVertexId: 'v8', endVertexId: 'v9', thickness: 8 },
    { id: 'w9', startVertexId: 'v8', endVertexId: 'v10', thickness: 8 },
    { id: 'w10', startVertexId: 'v10', endVertexId: 'v11', thickness: 8 },
  ],
  doors: [
    { id: 'd1', wallId: 'w7', position: 0.6, width: 40, direction: 'left' },
    { id: 'd2', wallId: 'w10', position: 0.5, width: 40, direction: 'right' },
  ],
  windows: [
    { id: 'win1', wallId: 'w1', position: 0.3, width: 60, height: 40 },
    { id: 'win2', wallId: 'w4', position: 0.5, width: 60, height: 40 },
    { id: 'win3', wallId: 'w5', position: 0.5, width: 100, height: 40 },
  ],
};

export const floorPlanPresets: FloorPlanPreset[] = [
  simpleRoomPreset,
  oneBedroomPreset,
  twoBedroomPreset,
  threeBedroomPreset,
  lShapePreset,
];

export function getPresetById(id: string): FloorPlanPreset | undefined {
  return floorPlanPresets.find(p => p.id === id);
}
