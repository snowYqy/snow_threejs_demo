import type { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  hasErrors: boolean;
  onExport?: () => void;
  isMobile?: boolean;
}

const tools: { type: ToolType; label: string; icon: string; shortLabel: string }[] = [
  { type: 'select', label: '选择', icon: '↖', shortLabel: '选' },
  { type: 'drawWall', label: '画墙', icon: '▭', shortLabel: '墙' },
  { type: 'door', label: '门', icon: '🚪', shortLabel: '门' },
  { type: 'window', label: '窗', icon: '⬜', shortLabel: '窗' },
  { type: 'delete', label: '删除', icon: '🗑', shortLabel: '删' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange, hasErrors, onExport, isMobile }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '6px 8px' : '8px 16px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0e0e0',
      gap: isMobile ? '4px' : '8px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ display: 'flex', gap: isMobile ? '2px' : '4px', flexShrink: 0 }}>
        {tools.map((tool) => (
          <button
            key={tool.type}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: isMobile ? '6px 8px' : '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: activeTool === tool.type ? '#2196F3' : '#fff',
              color: activeTool === tool.type ? '#fff' : '#333',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: isMobile ? '44px' : '60px',
              touchAction: 'manipulation',
            }}
            onClick={() => onToolChange(tool.type)}
            title={tool.label}
          >
            <span style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '2px' }}>{tool.icon}</span>
            <span style={{ fontSize: isMobile ? '10px' : '11px' }}>{isMobile ? tool.shortLabel : tool.label}</span>
          </button>
        ))}
      </div>
      
      <div style={{ width: '1px', height: isMobile ? '32px' : '40px', backgroundColor: '#e0e0e0', margin: '0 4px', flexShrink: 0 }} />
      
      <button
        style={{
          padding: isMobile ? '8px 12px' : '8px 16px',
          backgroundColor: hasErrors ? '#ccc' : '#4CAF50',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: hasErrors ? 'not-allowed' : 'pointer',
          fontSize: isMobile ? '12px' : '14px',
          flexShrink: 0,
          touchAction: 'manipulation',
        }}
        onClick={onExport}
        disabled={hasErrors}
        title={hasErrors ? '请先修复错误' : '导出到3D'}
      >
        {isMobile ? '导出' : '导出3D'}
      </button>
    </div>
  );
};
