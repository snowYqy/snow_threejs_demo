import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorPlan } from './FloorPlan';
import type { HomeData } from '../types/homeData';

interface Scene3DProps {
  homeData: HomeData;
  selectedRoom: string | null;
  hoveredRoom: string | null;
  onRoomSelect: (roomId: string | null) => void;
  onRoomHover: (roomId: string | null) => void;
}

/**
 * Scene3D组件 - 3D场景容器
 */
export const Scene3D: React.FC<Scene3DProps> = ({
  homeData,
  selectedRoom,
  hoveredRoom,
  onRoomSelect,
  onRoomHover,
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      
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
      
      <FloorPlan
        homeData={homeData}
        selectedRoom={selectedRoom}
        hoveredRoom={hoveredRoom}
        onRoomClick={(roomId) => onRoomSelect(selectedRoom === roomId ? null : roomId)}
        onRoomHover={onRoomHover}
      />
      
      <gridHelper args={[20, 20, '#888888', '#444444']} />
    </Canvas>
  );
};

export default Scene3D;
