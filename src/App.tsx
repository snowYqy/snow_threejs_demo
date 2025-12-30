import { useEffect, useState } from 'react';
import Scene3D from './components/Scene3D';
import UI from './components/UI';
import { useHomeStore } from './store/useHomeStore';
import { FloorPlanEditor } from './editor';

type ViewMode = '3d' | '2d-editor';

function App() {
  const { homeData, loading, error, fetchHomeData } = useHomeStore();
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // 2D Editor view
  if (viewMode === '2d-editor') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <FloorPlanEditor
          onClose={() => setViewMode('3d')}
          onExport={(data) => {
            console.log('Exported floor plan data:', data);
            // TODO: Convert to 3D and update homeData
            setViewMode('3d');
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <p className="text-white text-2xl font-medium">加载中...</p>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <p className="text-red-300 text-2xl font-medium">加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0">
        <Scene3D />
      </div>
      <UI />
      {/* 2D Editor Toggle Button */}
      <button
        onClick={() => setViewMode('2d-editor')}
        className="absolute bottom-4 left-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        2D 编辑器
      </button>
    </div>
  );
}

export default App;
