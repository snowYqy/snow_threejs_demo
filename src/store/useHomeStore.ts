import { create } from 'zustand';
import type { HomeData, DeviceData } from '../types/homeData';
import { loadHomeData, getRoomNames, getAllDevices } from '../data/homeDataLoader';

interface HomeState {
  // 数据状态
  homeData: HomeData | null;
  roomNames: Record<string, string>;
  loading: boolean;
  error: string | null;
  
  // 交互状态
  selectedRoom: string | null;
  hoveredRoom: string | null;
  
  // Actions
  fetchHomeData: (url?: string) => Promise<void>;
  setHomeData: (data: HomeData) => void;
  selectRoom: (roomId: string | null) => void;
  toggleRoom: (roomId: string) => void;
  hoverRoom: (roomId: string | null) => void;
  toggleDevice: (roomId: string, deviceId: string) => void;
  setDeviceState: (roomId: string, deviceId: string, isOn: boolean) => void;
  toggleAllDevicesInRoom: (roomId: string, isOn: boolean) => void;
  getDevicesByRoom: (roomId: string) => DeviceData[];
  getAllDevicesList: () => Array<DeviceData & { roomId: string; roomName: string }>;
  reset: () => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  // 初始状态
  homeData: null,
  roomNames: {},
  loading: true,
  error: null,
  selectedRoom: null,
  hoveredRoom: null,

  // 加载户型数据
  fetchHomeData: async (url = '/homeData.json') => {
    set({ loading: true, error: null });
    try {
      const data = await loadHomeData(url);
      set({
        homeData: data,
        roomNames: getRoomNames(data.rooms),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加载失败',
        loading: false,
      });
    }
  },

  // 直接设置户型数据（用于识别结果）
  setHomeData: (data) => {
    set({
      homeData: data,
      roomNames: getRoomNames(data.rooms),
      selectedRoom: null,
      hoveredRoom: null,
    });
  },

  // 选择房间
  selectRoom: (roomId) => {
    set({ selectedRoom: roomId });
  },

  // 切换房间选中状态
  toggleRoom: (roomId) => {
    const { selectedRoom } = get();
    set({ selectedRoom: selectedRoom === roomId ? null : roomId });
  },

  // 悬停房间
  hoverRoom: (roomId) => {
    set({ hoveredRoom: roomId });
  },

  // 切换设备开关
  toggleDevice: (roomId, deviceId) => {
    const { homeData } = get();
    if (!homeData) return;

    const newRooms = homeData.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.map(device => {
          if (device.id !== deviceId) return device;
          return { ...device, isOn: !device.isOn };
        }),
      };
    });

    set({ homeData: { ...homeData, rooms: newRooms } });
  },

  // 设置设备状态
  setDeviceState: (roomId, deviceId, isOn) => {
    const { homeData } = get();
    if (!homeData) return;

    const newRooms = homeData.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.map(device => {
          if (device.id !== deviceId) return device;
          return { ...device, isOn };
        }),
      };
    });

    set({ homeData: { ...homeData, rooms: newRooms } });
  },

  // 切换房间内所有设备
  toggleAllDevicesInRoom: (roomId, isOn) => {
    const { homeData } = get();
    if (!homeData) return;

    const newRooms = homeData.rooms.map(room => {
      if (room.id !== roomId) return room;
      return {
        ...room,
        devices: room.devices.map(device => ({ ...device, isOn })),
      };
    });

    set({ homeData: { ...homeData, rooms: newRooms } });
  },

  // 获取房间内的设备
  getDevicesByRoom: (roomId) => {
    const { homeData } = get();
    if (!homeData) return [];
    const room = homeData.rooms.find(r => r.id === roomId);
    return room?.devices ?? [];
  },

  // 获取所有设备列表
  getAllDevicesList: () => {
    const { homeData } = get();
    if (!homeData) return [];
    return getAllDevices(homeData.rooms);
  },

  // 重置状态
  reset: () => {
    set({
      selectedRoom: null,
      hoveredRoom: null,
    });
  },
}));
