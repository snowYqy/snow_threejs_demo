import { describe, it, expect } from 'vitest';
import { floorPlanData, getRoomNames, getRoomById } from './floorPlanData';

describe('floorPlanData', () => {
  it('should have correct total size', () => {
    expect(floorPlanData.totalSize).toEqual([16, 12]);
  });

  it('should have 9 rooms for 三室两厅 layout', () => {
    // 3 bedrooms + 2 halls (living + dining) + kitchen + bathroom + balcony + hallway = 9
    expect(floorPlanData.rooms.length).toBe(9);
  });

  it('should have 3 bedrooms', () => {
    const bedrooms = floorPlanData.rooms.filter(r => r.type === 'bedroom');
    expect(bedrooms.length).toBe(3);
  });

  it('should have living room and dining room (两厅)', () => {
    const livingRoom = floorPlanData.rooms.find(r => r.type === 'living');
    const diningRoom = floorPlanData.rooms.find(r => r.type === 'dining');
    expect(livingRoom).toBeDefined();
    expect(diningRoom).toBeDefined();
  });

  it('should have all required room properties', () => {
    floorPlanData.rooms.forEach(room => {
      expect(room.id).toBeDefined();
      expect(room.name).toBeDefined();
      expect(room.type).toBeDefined();
      expect(room.position).toHaveLength(3);
      expect(room.size).toHaveLength(3);
      expect(room.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have unique room IDs', () => {
    const ids = floorPlanData.rooms.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('getRoomNames', () => {
  it('should return a mapping of room IDs to names', () => {
    const names = getRoomNames();
    expect(names['living-room']).toBe('客厅');
    expect(names['master-bedroom']).toBe('主卧');
    expect(Object.keys(names).length).toBe(9);
  });
});

describe('getRoomById', () => {
  it('should return room config by ID', () => {
    const room = getRoomById('living-room');
    expect(room).toBeDefined();
    expect(room?.name).toBe('客厅');
  });

  it('should return undefined for non-existent ID', () => {
    const room = getRoomById('non-existent');
    expect(room).toBeUndefined();
  });
});
