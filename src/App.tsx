import { useState } from 'react';
import Scene3D from './components/Scene3D';
import UI from './components/UI';
import { getRoomNames } from './data/floorPlanData';
import './App.css';

/**
 * App组件 - 3D智能家居控制系统主应用
 * 
 * 功能:
 * - 集成Scene3D和UI组件
 * - 使用useState管理selectedRoom和hoveredRoom状态
 * - 提供房间选择和悬停的状态管理
 */
function App() {
  // 当前选中的房间ID
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  // 当前悬停的房间ID
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // 获取房间名称映射
  const roomNames = getRoomNames();

  return (
    <div className="app-container">
      {/* 3D场景容器 */}
      <div className="canvas-container">
        <Scene3D
          onRoomSelect={setSelectedRoom}
          onRoomHover={setHoveredRoom}
          selectedRoom={selectedRoom}
          hoveredRoom={hoveredRoom}
        />
      </div>
      
      {/* UI覆盖层 */}
      <UI
        selectedRoom={selectedRoom}
        roomNames={roomNames}
      />
    </div>
  );
}

export default App;
