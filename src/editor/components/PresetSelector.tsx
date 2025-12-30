import { floorPlanPresets, type FloorPlanPreset } from '../data/presets';

interface PresetSelectorProps {
  onSelect: (preset: FloorPlanPreset) => void;
  onClear: () => void;
  isMobile?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect, onClear, isMobile }) => {
  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '8px' : '16px',
      left: isMobile ? '8px' : '16px',
      right: isMobile ? '8px' : 'auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      minWidth: isMobile ? 'auto' : '180px',
      maxWidth: isMobile ? 'none' : '220px',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '8px 12px' : '10px 12px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <span style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px', color: '#333' }}>预设户型</span>
        <button
          onClick={onClear}
          title="清空画布"
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: '#666',
            touchAction: 'manipulation',
          }}
        >
          🗑️ 清空
        </button>
      </div>
      <div style={{
        display: isMobile ? 'grid' : 'flex',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'none',
        flexDirection: isMobile ? undefined : 'column',
        padding: '8px',
        gap: '6px',
        maxHeight: isMobile ? '200px' : '300px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {floorPlanPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            title={preset.description}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: isMobile ? '8px 10px' : '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontWeight: 500, fontSize: isMobile ? '13px' : '14px', color: '#333', marginBottom: '2px' }}>
              {preset.name}
            </span>
            <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#888', lineHeight: 1.3 }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
