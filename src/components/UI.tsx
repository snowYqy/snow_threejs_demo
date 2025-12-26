import type { UIProps } from '../types';
import './UI.css';

/**
 * UI组件 - 显示应用标题、操作说明和选中房间信息
 * 使用绝对定位覆盖在3D场景上
 */
const UI = ({ selectedRoom, roomNames }: UIProps) => {
  return (
    <div className="ui-overlay">
      {/* 标题区域 */}
      <div className="ui-header">
        <h1 className="ui-title">3D智能家居</h1>
      </div>

      {/* 操作说明 */}
      <div className="ui-instructions">
        <h3>操作说明</h3>
        <ul>
          <li>🖱️ 左键拖拽 - 旋转视角</li>
          <li>🖱️ 右键拖拽 - 平移视角</li>
          <li>🖱️ 滚轮 - 缩放视角</li>
          <li>🖱️ 点击房间 - 选中/取消选中</li>
        </ul>
      </div>

      {/* 选中房间信息 */}
      <div className="ui-room-info">
        <h3>当前选中</h3>
        <p className="room-name">
          {selectedRoom ? roomNames[selectedRoom] || '未知房间' : '无'}
        </p>
      </div>
    </div>
  );
};

export default UI;
