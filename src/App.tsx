import { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import UI from './components/UI';
import { loadHomeData, getRoomNames } from './data/homeDataLoader';
import type { HomeData } from './types/homeData';
import './App.css';

/**
 * App组件 - 数据驱动的3D智能家居控制系统
 */
function App() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载户型数据
  useEffect(() => {
    loadHomeData('/homeData.json')
      .then(data => {
        setHomeData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: '1.5rem' }}>加载中...</p>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ff6b6b', fontSize: '1.5rem' }}>加载失败: {error}</p>
      </div>
    );
  }

  const roomNames = getRoomNames(homeData.rooms);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Scene3D
          homeData={homeData}
          selectedRoom={selectedRoom}
          hoveredRoom={hoveredRoom}
          onRoomSelect={setSelectedRoom}
          onRoomHover={setHoveredRoom}
        />
      </div>
      <UI selectedRoom={selectedRoom} roomNames={roomNames} />
    </div>
  );
}

export default App;
