import { useEffect } from 'react';
import Scene3D from './components/Scene3D';
import UI from './components/UI';
import { useHomeStore } from './store/useHomeStore';

function App() {
  const { homeData, loading, error, fetchHomeData } = useHomeStore();

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

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
    </div>
  );
}

export default App;
