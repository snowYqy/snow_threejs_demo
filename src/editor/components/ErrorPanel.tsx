import type { EditorError } from '../types';

interface ErrorPanelProps {
  errors: EditorError[];
  onErrorClick?: (elementId: string) => void;
  isMobile?: boolean;
}

const errorTypeLabels: Record<string, string> = {
  unclosed_wall: '未封闭墙体',
  invalid_door: '无效门',
  invalid_window: '无效窗户',
  self_intersect: '墙体相交',
};

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors, onErrorClick, isMobile }) => {
  if (errors.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '8px' : '16px',
        right: isMobile ? '8px' : '16px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: isMobile ? '8px 12px' : '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4CAF50', fontSize: '16px' }}>✓</span>
          <span style={{ fontSize: isMobile ? '12px' : '14px' }}>无错误</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '8px' : '16px',
      right: isMobile ? '8px' : '16px',
      left: isMobile ? '8px' : 'auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: isMobile ? 'auto' : '200px',
      maxWidth: isMobile ? 'none' : '300px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: isMobile ? '8px 12px' : '12px 16px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 500,
      }}>
        <span style={{ color: '#f44336', fontSize: '16px' }}>⚠</span>
        <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{errors.length} 个错误</span>
      </div>
      <div style={{ maxHeight: isMobile ? '120px' : '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {errors.map((error) => (
          <div
            key={error.id}
            onClick={() => onErrorClick?.(error.elementId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: isMobile ? '8px 12px' : '10px 16px',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#f44336', fontWeight: 500 }}>
              {errorTypeLabels[error.type] || error.type}
            </span>
            <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#666', marginTop: '2px' }}>
              {error.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
