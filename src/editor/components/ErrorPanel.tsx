import type { EditorError, ValidationResult } from '../types';
import { useEditorStore } from '../store/useEditorStore';

interface ErrorPanelProps {
  errors: EditorError[];
  validationResult?: ValidationResult | null;
  onErrorClick?: (elementId: string) => void;
  isMobile?: boolean;
}

const errorTypeLabels: Record<string, string> = {
  // L1 错误
  no_closed_room: '无闭合房间',
  room_too_small: '房间面积过小',
  wall_too_short: '墙体过短',
  wall_self_intersect: '墙体相交',
  wall_dead_end: '墙体断点',
  door_no_wall: '门无墙体',
  window_no_wall: '窗无墙体',
  door_too_wide: '门过宽',
  window_too_wide: '窗过宽',
  door_out_of_wall: '门位置异常',
  window_out_of_wall: '窗位置异常',
  // L2 错误
  room_overlap: '房间重叠',
  device_no_binding: '设备未绑定',
  device_out_of_room: '设备超出房间',
  // 兼容旧类型
  unclosed_wall: '未封闭墙体',
  invalid_door: '无效门',
  invalid_window: '无效窗户',
  self_intersect: '墙体相交',
};

const levelColors = {
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

const levelIcons = {
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors, validationResult, onErrorClick, isMobile }) => {
  const autoFixErrors = useEditorStore(state => state.autoFixErrors);
  
  // 分离错误和警告
  const errorList = errors.filter(e => e.level === 'error');
  const warningList = errors.filter(e => e.level === 'warning');
  const hasAutoFixable = errors.some(e => e.autoFixable);
  
  if (errors.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '8px' : '16px',
        right: isMobile ? '60px' : '16px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: isMobile ? '8px 12px' : '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4CAF50', fontSize: '16px' }}>✓</span>
          <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {validationResult?.canExport ? '可导出3D' : '无错误'}
          </span>
        </div>
        {validationResult && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {validationResult.roomCount} 个房间 · {(validationResult.totalArea / 10000).toFixed(1)}㎡
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '8px' : '16px',
      right: isMobile ? '60px' : '16px',
      left: isMobile ? '8px' : 'auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: isMobile ? 'auto' : '220px',
      maxWidth: isMobile ? 'none' : '320px',
      overflow: 'hidden',
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '12px 16px',
        backgroundColor: errorList.length > 0 ? '#ffebee' : '#fff3e0',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>
            {errorList.length > 0 ? '❌' : '⚠️'}
          </span>
          <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 500 }}>
            {errorList.length > 0 
              ? `${errorList.length} 个错误` 
              : `${warningList.length} 个警告`}
          </span>
        </div>
        {hasAutoFixable && (
          <button
            onClick={autoFixErrors}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            自动修复
          </button>
        )}
      </div>
      
      {/* 导出状态 */}
      {validationResult && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: validationResult.canExport ? '#e8f5e9' : '#ffebee',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>{validationResult.canExport ? '✓' : '✗'}</span>
          <span>{validationResult.canExport ? '可导出3D' : '无法导出3D'}</span>
          {validationResult.roomCount > 0 && (
            <span style={{ color: '#666', marginLeft: 'auto' }}>
              {validationResult.roomCount}房间 · {(validationResult.totalArea / 10000).toFixed(1)}㎡
            </span>
          )}
        </div>
      )}
      
      {/* 错误列表 */}
      <div style={{ maxHeight: isMobile ? '120px' : '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {errors.map((error) => (
          <div
            key={error.id}
            onClick={() => onErrorClick?.(error.elementId)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: isMobile ? '8px 12px' : '10px 16px',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: '12px' }}>
              {levelIcons[error.level || 'error']}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                color: levelColors[error.level || 'error'], 
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {errorTypeLabels[error.type] || error.type}
                {error.autoFixable && (
                  <span style={{ 
                    fontSize: '10px', 
                    backgroundColor: '#e3f2fd', 
                    color: '#1976d2',
                    padding: '1px 4px',
                    borderRadius: '2px',
                  }}>
                    可修复
                  </span>
                )}
              </div>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#666', marginTop: '2px' }}>
                {error.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
