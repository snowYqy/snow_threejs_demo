import React, { useCallback, useRef, useState } from 'react';

interface ImageUploadPanelProps {
  onImageSelect: (file: File) => void;
  onRecognize: () => void;
  isProcessing: boolean;
  previewUrl: string | null;
}

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * ImageUploadPanel 组件 - 户型图上传面板
 * 支持文件选择器和拖拽上传
 * Requirements: 1.1, 1.4
 */
const ImageUploadPanel: React.FC<ImageUploadPanelProps> = ({
  onImageSelect,
  onRecognize,
  isProcessing,
  previewUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // 检查文件格式 (Requirement 1.2, 1.3)
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return '不支持的文件格式，请上传 PNG、JPG 或 JPEG 图片';
    }
    // 检查文件大小 (Requirement 1.5, 1.6)
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小超过 10MB 限制，请压缩后重试';
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onImageSelect(file);
  }, [validateFile, onImageSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="p-4 bg-white/95 rounded-lg shadow-lg min-w-[280px]">
      <h3 className="m-0 mb-3 text-base font-semibold text-gray-800">
        📐 户型图识别
      </h3>

      {/* 拖拽上传区域 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {previewUrl ? (
          /* 图片预览 (Requirement 1.4) */
          <div className="space-y-2">
            <img
              src={previewUrl}
              alt="户型图预览"
              className="max-w-full max-h-40 mx-auto rounded border border-gray-200"
            />
            <p className="text-xs text-gray-500">点击或拖拽更换图片</p>
          </div>
        ) : (
          /* 上传提示 */
          <div className="py-4">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-sm text-gray-600 mb-1">
              点击选择或拖拽上传户型图
            </p>
            <p className="text-xs text-gray-400">
              支持 PNG、JPG、JPEG，最大 10MB
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* 识别按钮 */}
      {previewUrl && (
        <button
          onClick={onRecognize}
          disabled={isProcessing}
          className={`
            w-full mt-3 px-4 py-2 rounded-lg font-medium text-white
            transition-colors duration-200
            ${isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              AI 识别中...
            </span>
          ) : (
            '🤖 AI 智能识别'
          )}
        </button>
      )}

      {/* 提示信息 */}
      {isProcessing && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          正在使用 GPT-4 Vision 分析户型图，请稍候...
        </p>
      )}
    </div>
  );
};

export default ImageUploadPanel;
