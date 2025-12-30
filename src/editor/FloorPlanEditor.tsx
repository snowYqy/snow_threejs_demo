import { useEditorStore } from './store/useEditorStore';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/Toolbar';
import { ErrorPanel } from './components/ErrorPanel';
import { PresetSelector } from './components/PresetSelector';
import { useResponsive } from './hooks/useResponsive';
import { useState } from 'react';

interface FloorPlanEditorProps {
  onExport?: (data: ExportData) => void;
  onClose?: () => void;
}

export interface ExportData {
  vertices: Array<{ id: string; x: number; y: number }>;
  walls: Array<{ id: string; startVertexId: string; endVertexId: string; thickness: number }>;
  rooms: Array<{ id: string; vertexIds: string[]; name: string }>;
  doors: Array<{ id: string; wallId: string; position: number; width: number; direction: string }>;
  windows: Array<{ id: string; wallId: string; position: number; width: number; height: number }>;
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ onExport, onClose }) => {
  const { isMobile } = useResponsive();
  const [showPresets, setShowPresets] = useState(!isMobile);
  
  const {
    activeTool, setActiveTool, errors, vertices, walls, rooms, doors, windows,
    setSelectedIds, loadPreset, clearAll,
  } = useEditorStore();

  const handleExport = () => {
    if (errors.length > 0) return;
    const exportData: ExportData = {
      vertices: Array.from(vertices.values()),
      walls: Array.from(walls.values()),
      rooms: Array.from(rooms.values()).map(r => ({ id: r.id, vertexIds: r.vertexIds, name: r.name })),
      doors: Array.from(doors.values()).map(d => ({ id: d.id, wallId: d.wallId, position: d.position, width: d.width, direction: d.direction })),
      windows: Array.from(windows.values()).map(w => ({ id: w.id, wallId: w.wallId, position: w.position, width: w.width, height: w.height })),
    };
    onExport?.(exportData);
  };

  const handlePresetSelect = (preset: Parameters<typeof loadPreset>[0]) => {
    loadPreset(preset);
    if (isMobile) setShowPresets(false);
  };

  const hints: Record<string, string> = {
    drawWall: isMobile ? '点击绘制墙体' : '点击画布开始绘制墙体，连续点击绘制多段墙，按 ESC 取消',
    select: isMobile ? '点击选择，拖拽移动' : '点击选择元素，拖拽顶点移动位置，按 Delete 删除',
    delete: '点击删除', door: '点击墙体添加门', window: '点击墙体添加窗',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '8px 12px' : '12px 16px', borderBottom: '1px solid #e0e0e0' }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 600 }}>2D 户型编辑器</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isMobile && (
            <button onClick={() => setShowPresets(!showPresets)} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: showPresets ? '#2196F3' : '#fff', color: showPresets ? '#fff' : '#333', fontSize: '12px', cursor: 'pointer' }}>
              📋 预设
            </button>
          )}
          {onClose && <button onClick={onClose} style={{ padding: '4px 8px', border: 'none', backgroundColor: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#666' }}>✕</button>}
        </div>
      </div>
      
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} hasErrors={errors.length > 0} onExport={handleExport} isMobile={isMobile} />
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <EditorCanvas />
        {showPresets && <PresetSelector onSelect={handlePresetSelect} onClear={clearAll} isMobile={isMobile} />}
        <ErrorPanel errors={errors} onErrorClick={(id) => setSelectedIds([id])} isMobile={isMobile} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '6px 12px' : '8px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', fontSize: isMobile ? '11px' : '13px', color: '#666', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}><strong>提示：</strong>{hints[activeTool] || ''}</div>
        <div style={{ color: '#999' }}>墙:{walls.size} 房:{rooms.size} 门:{doors.size} 窗:{windows.size}</div>
      </div>
    </div>
  );
};

export default FloorPlanEditor;
