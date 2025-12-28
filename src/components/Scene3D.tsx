import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorPlan } from './FloorPlan';
import { useHomeStore } from '../store/useHomeStore';
import * as THREE from 'three';

/**
 * Scene3D组件 - 3D场景容器
 * 采用米家/Apple Home风格的灯光配置
 */
export const Scene3D: React.FC = () => {
  const homeData = useHomeStore((state) => state.homeData);

  if (!homeData) return null;

  return (
    <Canvas
      camera={{
        position: [15, 15, 15],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      className="w-full h-full"
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      {/* 环境光 - 整体亮度，柔和 */}
      <ambientLight intensity={0.35} color="#ffffff" />
      
      {/* 主光 - 模拟窗户/天光，暖色调 */}
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={2.2} 
        color="#fff1d0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={4}
        shadow-bias={-0.0001}
      />
      
      {/* 补光 - 消除死黑区域 */}
      <directionalLight 
        position={[-8, 6, -8]} 
        intensity={1.1} 
        color="#ffffff"
      />
      
      {/* 底部微弱补光 - 模拟地面反射 */}
      <directionalLight 
        position={[0, -5, 0]} 
        intensity={0.3} 
        color="#f5f5f5"
      />
      
      <OrbitControls
        enableRotate={true}
        enableZoom={true}
        enablePan={true}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      <FloorPlan />
      
      {/* 网格辅助线 - 更淡的颜色 */}
      <gridHelper args={[20, 20, '#cccccc', '#e0e0e0']} />
    </Canvas>
  );
};

export default Scene3D;
