import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { floorPlanData } from './floorPlanData';
import type { RoomConfig, RoomType } from '../types';

/**
 * Property-Based Tests for Floor Plan Data
 * 
 * Feature: 3d-smart-home, Property 2: 房间数据完整性
 * Validates: Requirements 3.1, 3.2, 3.3
 * 
 * Property 2: 房间数据完整性
 * *For any* room in the floor plan, the room must have:
 * - A unique non-empty ID
 * - A non-empty name
 * - A valid room type
 * - Valid 3D position coordinates
 * - Valid positive size dimensions
 * - A valid hex color code
 */

const validRoomTypes: RoomType[] = ['bedroom', 'living', 'dining', 'kitchen', 'bathroom', 'balcony', 'hallway'];

describe('Property 2: 房间数据完整性 (Room Data Integrity)', () => {
  /**
   * Property: For all rooms in the floor plan, each room must have a unique non-empty ID
   * Validates: Requirement 3.1 - Room identification
   */
  it('should have unique non-empty IDs for all rooms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          // ID must be non-empty string
          expect(room.id).toBeTruthy();
          expect(typeof room.id).toBe('string');
          expect(room.id.length).toBeGreaterThan(0);
          
          // ID must be unique across all rooms
          const roomsWithSameId = floorPlanData.rooms.filter(r => r.id === room.id);
          expect(roomsWithSameId.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For all rooms, each room must have a non-empty name
   * Validates: Requirement 3.2 - Room naming
   */
  it('should have non-empty names for all rooms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          expect(room.name).toBeTruthy();
          expect(typeof room.name).toBe('string');
          expect(room.name.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For all rooms, each room must have a valid room type
   * Validates: Requirement 3.3 - Room type classification
   */
  it('should have valid room types for all rooms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          expect(validRoomTypes).toContain(room.type);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For all rooms, position must be a valid 3D coordinate tuple
   * Validates: Requirement 3.1 - Room spatial configuration
   */
  it('should have valid 3D position coordinates for all rooms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          expect(Array.isArray(room.position)).toBe(true);
          expect(room.position).toHaveLength(3);
          room.position.forEach(coord => {
            expect(typeof coord).toBe('number');
            expect(Number.isFinite(coord)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For all rooms, size must be positive dimensions [width, height, depth]
   * Validates: Requirement 3.2 - Room dimensions
   */
  it('should have positive size dimensions for all rooms', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          expect(Array.isArray(room.size)).toBe(true);
          expect(room.size).toHaveLength(3);
          room.size.forEach(dimension => {
            expect(typeof dimension).toBe('number');
            expect(dimension).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For all rooms, color must be a valid hex color code
   * Validates: Requirement 3.3 - Room visual configuration
   */
  it('should have valid hex color codes for all rooms', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    
    fc.assert(
      fc.property(
        fc.constantFrom(...floorPlanData.rooms),
        (room: RoomConfig) => {
          expect(typeof room.color).toBe('string');
          expect(room.color).toMatch(hexColorRegex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Floor plan must contain the required room types for 三室两厅 layout
   * Validates: Requirements 3.1, 3.2, 3.3 - Complete floor plan structure
   */
  it('should contain required room types for 三室两厅 layout', () => {
    const roomTypes = floorPlanData.rooms.map(r => r.type);
    
    // Must have exactly 3 bedrooms (三室)
    const bedroomCount = roomTypes.filter(t => t === 'bedroom').length;
    expect(bedroomCount).toBe(3);
    
    // Must have living room and dining room (两厅)
    expect(roomTypes).toContain('living');
    expect(roomTypes).toContain('dining');
    
    // Must have essential rooms
    expect(roomTypes).toContain('kitchen');
    expect(roomTypes).toContain('bathroom');
  });

  /**
   * Property: Total floor plan size must be valid positive dimensions
   * Validates: Requirement 3.1 - Floor plan configuration
   */
  it('should have valid total floor plan size', () => {
    expect(Array.isArray(floorPlanData.totalSize)).toBe(true);
    expect(floorPlanData.totalSize).toHaveLength(2);
    floorPlanData.totalSize.forEach(dimension => {
      expect(typeof dimension).toBe('number');
      expect(dimension).toBeGreaterThan(0);
    });
  });
});
