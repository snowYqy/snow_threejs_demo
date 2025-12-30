import { create } from 'zustand';
import type { HomeData, RoomType } from '../types/homeData';

/**
 * 识别出的房间数据
 */
export interface RecognizedRoom {
  id: string;
  name: string;
  type: RoomType;
  bounds: {
    x: number;      // 像素坐标
    y: number;
    width: number;
    height: number;
  };
  confidence: number;  // 识别置信度 0-1
}

/**
 * 墙体线段
 */
export interface WallSegment {
  start: [number, number];
  end: [number, number];
  thickness: number;
}

/**
 * 门信息
 */
export interface DoorInfo {
  position: [number, number];
  width: number;
  wallId?: string;
}

/**
 * 窗户信息
 */
export interface WindowInfo {
  position: [number, number];
  width: number;
  height: number;
  wallId?: string;
}

/**
 * 比例信息
 */
export interface ScaleInfo {
  pixelsPerMeter: number;
  estimated: boolean;
  referenceLength?: number;
}

/**
 * 识别结果
 */
export interface RecognitionResult {
  rooms: RecognizedRoom[];
  walls: WallSegment[];
  doors: DoorInfo[];
  windows: WindowInfo[];
  scale: ScaleInfo;
  imageSize: { width: number; height: number };
}

/**
 * 上传状态
 */
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

/**
 * 编辑模式
 */
export type EditMode = 'select' | 'move' | 'resize' | 'add' | 'delete';

/**
 * Recognition Store 状态接口
 */
interface RecognitionState {
  // 上传状态管理
  uploadStatus: UploadStatus;
  uploadError: string | null;
  uploadedImage: File | null;
  previewUrl: string | null;
  
  // 识别结果存储
  recognitionResult: RecognitionResult | null;
  generatedHomeData: HomeData | null;
  
  // 编辑状态管理
  editMode: EditMode;
  selectedRoomId: string | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions - 上传相关
  setUploadedImage: (file: File | null) => void;
  setUploadStatus: (status: UploadStatus) => void;
  setUploadError: (error: string | null) => void;
  clearUpload: () => void;
  
  // Actions - 识别相关
  setRecognitionResult: (result: RecognitionResult | null) => void;
  setGeneratedHomeData: (data: HomeData | null) => void;
  recognizeImage: () => Promise<void>;
  
  // Actions - 编辑相关
  setEditMode: (mode: EditMode) => void;
  selectRoom: (roomId: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  
  // Actions - 房间编辑
  updateRoom: (roomId: string, updates: Partial<RecognizedRoom>) => void;
  addRoom: (room: RecognizedRoom) => void;
  deleteRoom: (roomId: string) => void;
  
  // Actions - 重置
  reset: () => void;
}

const initialState = {
  uploadStatus: 'idle' as UploadStatus,
  uploadError: null,
  uploadedImage: null,
  previewUrl: null,
  recognitionResult: null,
  generatedHomeData: null,
  editMode: 'select' as EditMode,
  selectedRoomId: null,
  isEditing: false,
  hasUnsavedChanges: false,
};

// API base URL
const API_BASE = 'http://localhost:8000/api';

/**
 * Recognition Store - 户型图识别状态管理
 * Requirements: 状态管理
 */
export const useRecognitionStore = create<RecognitionState>((set, get) => ({
  ...initialState,

  // 设置上传的图片
  setUploadedImage: (file) => {
    // 清理旧的预览 URL
    const oldUrl = get().previewUrl;
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      set({
        uploadedImage: file,
        previewUrl,
        uploadStatus: 'idle',
        uploadError: null,
        generatedHomeData: null,
      });
    } else {
      set({
        uploadedImage: null,
        previewUrl: null,
      });
    }
  },

  // 设置上传状态
  setUploadStatus: (status) => {
    set({ uploadStatus: status });
  },

  // 设置上传错误
  setUploadError: (error) => {
    set({
      uploadError: error,
      uploadStatus: error ? 'error' : get().uploadStatus,
    });
  },

  // 清除上传
  clearUpload: () => {
    const oldUrl = get().previewUrl;
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    set({
      uploadedImage: null,
      previewUrl: null,
      uploadStatus: 'idle',
      uploadError: null,
      recognitionResult: null,
      generatedHomeData: null,
    });
  },

  // 设置识别结果
  setRecognitionResult: (result) => {
    set({
      recognitionResult: result,
      uploadStatus: result ? 'success' : get().uploadStatus,
      hasUnsavedChanges: false,
    });
  },

  // 设置生成的 HomeData
  setGeneratedHomeData: (data) => {
    set({ generatedHomeData: data });
  },

  // 使用 Qwen Vision AI 识别图片
  recognizeImage: async () => {
    const { uploadedImage } = get();
    if (!uploadedImage) {
      set({ uploadError: '请先上传图片' });
      return;
    }

    set({ uploadStatus: 'processing', uploadError: null });

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadedImage);
      });

      // Get image dimensions
      const img = new Image();
      const imageDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = base64;
      });

      // First check if Qwen is configured
      const statusResponse = await fetch(`${API_BASE}/qwen/status`);
      const statusData = await statusResponse.json();

      if (!statusData.configured) {
        throw new Error('通义千问 Vision 未配置，请在后端设置 DASHSCOPE_API_KEY 环境变量');
      }

      // Call Qwen Vision API
      const response = await fetch(`${API_BASE}/qwen/analyze-with-dimensions?image_width=${imageDimensions.width}&image_height=${imageDimensions.height}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          pixels_per_meter: 50.0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || '识别失败');
      }

      if (data.success && data.homedata_rooms) {
        // Convert Qwen rooms to HomeData format
        const convertedRooms = data.homedata_rooms.map((room: any) => ({
          id: room.id,
          name: room.name,
          type: room.type as RoomType,
          position: [room.position.x, room.position.z] as [number, number],
          size: [room.size.width, room.size.depth] as [number, number],
          color: room.color,
          devices: room.devices || [],
        }));

        // Create HomeData object
        const homeData: HomeData = {
          meta: {
            version: '1.0',
            name: '识别户型',
            unit: 'm',
            wallHeight: 3,
            wallThickness: 0.2,
          },
          rooms: convertedRooms,
          walls: [],
        };

        set({
          generatedHomeData: homeData,
          uploadStatus: 'success',
          uploadError: null,
        });
      } else {
        throw new Error(data.error || '识别失败，请重试');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '识别失败';
      set({
        uploadStatus: 'error',
        uploadError: message,
      });
    }
  },

  // 设置编辑模式
  setEditMode: (mode) => {
    set({ editMode: mode });
  },

  // 选择房间
  selectRoom: (roomId) => {
    set({ selectedRoomId: roomId });
  },

  // 设置编辑状态
  setIsEditing: (editing) => {
    set({ isEditing: editing });
  },

  // 更新房间
  updateRoom: (roomId, updates) => {
    const { recognitionResult } = get();
    if (!recognitionResult) return;

    const updatedRooms = recognitionResult.rooms.map((room) =>
      room.id === roomId ? { ...room, ...updates } : room
    );

    set({
      recognitionResult: { ...recognitionResult, rooms: updatedRooms },
      hasUnsavedChanges: true,
    });
  },

  // 添加房间
  addRoom: (room) => {
    const { recognitionResult } = get();
    if (!recognitionResult) return;

    set({
      recognitionResult: {
        ...recognitionResult,
        rooms: [...recognitionResult.rooms, room],
      },
      hasUnsavedChanges: true,
    });
  },

  // 删除房间
  deleteRoom: (roomId) => {
    const { recognitionResult, selectedRoomId } = get();
    if (!recognitionResult) return;

    const updatedRooms = recognitionResult.rooms.filter(
      (room) => room.id !== roomId
    );

    set({
      recognitionResult: { ...recognitionResult, rooms: updatedRooms },
      selectedRoomId: selectedRoomId === roomId ? null : selectedRoomId,
      hasUnsavedChanges: true,
    });
  },

  // 重置所有状态
  reset: () => {
    const oldUrl = get().previewUrl;
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    set(initialState);
  },
}));
