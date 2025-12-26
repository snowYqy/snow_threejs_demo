import { create } from 'zustand';
import type { HomeData } from '../types/homeData';
import { loadHomeData, getRoomNames } from '../data/homeDataLoader';

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
  selectRoom: (roomId: string | null) => void;
  toggleRoom: (roomId: string) => void;
  hoverRoom: (roomId: string | null) => void;
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

  // 重置状态
  reset: () => {
    set({
      selectedRoom: null,
      hoveredRoom: null,
    });
  },
}));
