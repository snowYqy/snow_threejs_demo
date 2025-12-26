import { describe, it, expect } from 'vitest';
import type { RoomConfig, FloorPlanConfig } from './index';

describe('Types', () => {
  it('should allow valid RoomConfig', () => {
    const room: RoomConfig = {
      id: 'test-room',
      name: 'Test Room',
      type: 'bedroom',
      position: [0, 0, 0],
      size: [4, 3, 4],
      color: '#ffffff',
    };
    expect(room.id).toBe('test-room');
  });

  it('should allow valid FloorPlanConfig', () => {
    const floorPlan: FloorPlanConfig = {
      rooms: [],
      totalSize: [16, 12],
    };
    expect(floorPlan.totalSize).toEqual([16, 12]);
  });
});
