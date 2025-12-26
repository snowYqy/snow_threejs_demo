import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorPlan } from './FloorPlan';
import type { Scene3DProps } from '../types';

/**
 * Scene3D组件 - 3D场景容器
 * 
 * 功能:
 * - 使用@react-three/fiber的Canvas创建3D渲染环境
 * - 配置透视相机（位置[15, 15, 15]）
 * - 添加环境光（强度0.6）和方向光（强度0.8）
 * - 集成OrbitControls实现相机控制
 * - 集成FloorPlan组件渲染户型
 */
export const Scene3D: React.FC<Scene3DProps> = ({
  onRoomSelect,
  onRoomHover,
  selectedRoom,
  hoveredRoom,
}) => {
  return (
    <Canvas
      camera={{
        position: [15, 15, 15],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 环境光 - 提供均匀的基础照明 */}
      <ambientLight intensity={0.6} />
      
      {/* 方向光 - 模拟太阳光，提供阴影效果 */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
      />
      
      {/* OrbitControls - 相机控制 */}
      {/* 
        配置说明:
        - enableRotate: 启用旋转功能
        - enableZoom: 启用缩放功能  
        - enablePan: 启用平移功能
        - minDistance/maxDistance: 缩放范围限制 (5-50)
        - maxPolarAngle: 限制相机不能低于地平面
        - target: 相机观察目标点（户型中心）
      */}
      <OrbitControls
        enableRotate={true}
        enableZoom={true}
        enablePan={true}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0.1} // 限制相机不能完全垂直向下
        maxPolarAngle={Math.PI / 2.1} // 限制相机不能低于地平面
        target={[0, 0, 0]} // 相机观察目标点（户型中心）
        enableDamping={true} // 启用阻尼效果，使控制更平滑
        dampingFactor={0.05}
      />
      
      {/* FloorPlan组件 - 渲染户型布局 */}
      <FloorPlan
        onRoomClick={(roomId) => onRoomSelect(selectedRoom === roomId ? null : roomId)}
        onRoomHover={onRoomHover}
        selectedRoom={selectedRoom}
        hoveredRoom={hoveredRoom}
      />
      
      {/* 地面网格 - 用于空间参考 */}
      <gridHelper args={[20, 20, '#888888', '#444444']} />
    </Canvas>
  );
};

export default Scene3D;
