import { useMemo, useRef, useState, useEffect } from 'react';
import { Color, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import type { DeviceData } from '../types/homeData';
import { DEVICE_COLORS } from '../types/homeData';
import { getDeviceOffset, getDeviceSize } from '../data/homeDataLoader';
import { useHomeStore } from '../store/useHomeStore';

interface DeviceProps {
  data: DeviceData;
  wallHeight: number;
  roomId: string;
}

/**
 * 窗帘组件 - 带动画效果
 */
const Curtain: React.FC<{
  width: number;
  height: number;
  depth: number;
  isOn: boolean;
  deviceColor: Color;
}> = ({ width, height, depth, isOn, deviceColor }) => {
  const curtainRef = useRef<Mesh>(null);
  const [animProgress, setAnimProgress] = useState(isOn ? 1 : 0);
  const targetProgress = isOn ? 1 : 0;

  // 动画更新
  useFrame((_, delta) => {
    if (Math.abs(animProgress - targetProgress) > 0.01) {
      const speed = 2; // 动画速度
      const newProgress = animProgress + (targetProgress - animProgress) * speed * delta * 3;
      setAnimProgress(newProgress);
      
      if (curtainRef.current) {
        // 窗帘高度从 height/2 (收起) 到 height (展开)
        const curtainHeight = height / 2 + (height / 2) * newProgress;
        // 窗帘位置从 height/4 (收起) 到 0 (展开)
        const curtainY = height / 4 * (1 - newProgress);
        
        curtainRef.current.scale.y = curtainHeight / height;
        curtainRef.current.position.y = curtainY;
      }
    }
  });

  // 当 isOn 变化时触发动画
  useEffect(() => {
    // 动画会在 useFrame 中自动处理
  }, [isOn]);

  return (
    <group>
      {/* 窗帘杆 */}
      <mesh position={[0, height / 2 - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, depth, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* 窗帘布 - 带动画 */}
      <mesh ref={curtainRef} position={[0, isOn ? 0 : height / 4, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={deviceColor} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      {/* 窗帘环 */}
      {[...Array(5)].map((_, i) => (
        <mesh 
          key={i} 
          position={[0, height / 2 - 0.05, (i - 2) * (depth / 5)]}
        >
          <torusGeometry args={[0.03, 0.008, 8, 16]} />
          <meshStandardMaterial color="#A0522D" />
        </mesh>
      ))}
    </group>
  );
};

/**
 * 风扇组件 - 带旋转动画
 */
const Fan: React.FC<{
  width: number;
  height: number;
  isOn: boolean;
  deviceColor: Color;
}> = ({ height, isOn, deviceColor }) => {
  const bladeRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (bladeRef.current && isOn) {
      bladeRef.current.rotation.z += delta * 10; // 旋转速度
    }
  });

  return (
    <group>
      {/* 底座 */}
      <mesh position={[0, -height / 2 + 0.05, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* 支柱 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, height - 0.3, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      {/* 风扇头外壳 */}
      <mesh position={[0, height / 2 - 0.2, 0.1]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <meshStandardMaterial color={deviceColor} />
      </mesh>
      {/* 扇叶 - 带旋转动画 */}
      <group position={[0, height / 2 - 0.2, 0.15]}>
        <mesh ref={bladeRef}>
          {/* 三片扇叶 */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <boxGeometry args={[0.02, 0.15, 0.01]} />
              <meshStandardMaterial color={isOn ? '#E0E0E0' : '#888888'} />
            </mesh>
          ))}
        </mesh>
        {/* 中心 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
      {/* 防护网 */}
      <mesh position={[0, height / 2 - 0.2, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.01, 8, 24]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
    </group>
  );
};

/**
 * Device组件 - 渲染智能设备
 */
export const Device: React.FC<DeviceProps> = ({ data, wallHeight, roomId }) => {
  const meshRef = useRef<Mesh>(null);
  const toggleDevice = useHomeStore((state) => state.toggleDevice);
  
  const offset = getDeviceOffset(data, wallHeight);
  const [width, height, depth] = getDeviceSize(data);
  const rotation = (data.rotation ?? 0) * Math.PI / 180;
  const isOn = data.isOn ?? false;

  const colors = DEVICE_COLORS[data.type];
  const deviceColor = useMemo(() => new Color(isOn ? colors.on : colors.off), [isOn, colors]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    toggleDevice(roomId, data.id);
  };

  const renderByType = () => {
    switch (data.type) {
      case 'light':
        return (
          <group>
            {/* 灯座 */}
            <mesh>
              <cylinderGeometry args={[0.15, 0.2, 0.08, 16]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* 灯泡 */}
            <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial 
                color={isOn ? '#FFFACD' : '#808080'} 
                emissive={isOn ? '#FFD700' : undefined}
                emissiveIntensity={isOn ? 1 : 0}
                transparent
                opacity={isOn ? 0.9 : 1}
              />
            </mesh>
            {/* 光晕效果 - 多层散射 */}
            {isOn && (
              <>
                {/* 内层光晕 */}
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.2, 16, 16]} />
                  <meshBasicMaterial 
                    color="#FFD700" 
                    transparent 
                    opacity={0.3}
                  />
                </mesh>
                {/* 中层光晕 */}
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.35, 16, 16]} />
                  <meshBasicMaterial 
                    color="#FFA500" 
                    transparent 
                    opacity={0.15}
                  />
                </mesh>
                {/* 外层光晕 */}
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshBasicMaterial 
                    color="#FFE4B5" 
                    transparent 
                    opacity={0.08}
                  />
                </mesh>
                {/* 向下的锥形光束 */}
                <mesh position={[0, -0.8, 0]}>
                  <coneGeometry args={[0.8, 1.2, 32, 1, true]} />
                  <meshBasicMaterial 
                    color="#FFD700" 
                    transparent 
                    opacity={0.06}
                    side={2}
                  />
                </mesh>
                {/* 点光源 - 主光源 */}
                <pointLight 
                  position={[0, -0.15, 0]} 
                  intensity={2} 
                  distance={8} 
                  color="#FFD700"
                  decay={2}
                />
                {/* 聚光灯 - 向下照射 */}
                <spotLight
                  position={[0, -0.15, 0]}
                  angle={Math.PI / 3}
                  penumbra={0.5}
                  intensity={1.5}
                  distance={6}
                  color="#FFF8DC"
                  target-position={[0, -3, 0]}
                />
              </>
            )}
          </group>
        );

      case 'ac':
        return (
          <group>
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, -height / 2 + 0.02, depth / 2 - 0.02]}>
              <boxGeometry args={[width * 0.8, 0.04, 0.02]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            <mesh position={[width / 2 - 0.1, 0, depth / 2 + 0.01]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial 
                color={isOn ? '#00FF00' : '#333333'} 
                emissive={isOn ? '#00FF00' : undefined}
                emissiveIntensity={isOn ? 1 : 0}
              />
            </mesh>
          </group>
        );

      case 'fan':
        return <Fan width={width} height={height} isOn={isOn} deviceColor={deviceColor} />;

      case 'curtain':
        return <Curtain width={width} height={height} depth={depth} isOn={isOn} deviceColor={deviceColor} />;

      case 'tv':
        return (
          <group>
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={isOn ? '#1a1a2e' : '#0a0a0a'} />
            </mesh>
            {isOn && (
              <mesh position={[0, 0, depth / 2 + 0.001]}>
                <planeGeometry args={[width * 0.95, height * 0.9]} />
                <meshStandardMaterial 
                  color={deviceColor}
                  emissive={deviceColor}
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </group>
        );

      case 'speaker':
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[width / 2, width / 2 * 0.8, height, 16]} />
              <meshStandardMaterial color="#2F2F2F" />
            </mesh>
            <mesh position={[0, height / 2 - 0.02, 0]}>
              <torusGeometry args={[width / 2 - 0.02, 0.01, 8, 32]} />
              <meshStandardMaterial 
                color={deviceColor}
                emissive={isOn ? deviceColor : undefined}
                emissiveIntensity={isOn ? 1 : 0}
              />
            </mesh>
          </group>
        );

      case 'humidifier':
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[width / 2, width / 2, height * 0.7, 16]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, height / 2 - 0.1, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 0.1, 16]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            {isOn && (
              <mesh position={[0, height / 2 + 0.1, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#ADD8E6" transparent opacity={0.4} />
              </mesh>
            )}
          </group>
        );

      case 'purifier':
        return (
          <group>
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.01]}>
              <boxGeometry args={[width * 0.6, 0.15, 0.02]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            <mesh position={[0, -height / 2 + 0.1, depth / 2 + 0.01]}>
              <circleGeometry args={[0.03, 16]} />
              <meshStandardMaterial 
                color={isOn ? '#00FF00' : '#333333'}
                emissive={isOn ? '#00FF00' : undefined}
                emissiveIntensity={isOn ? 1 : 0}
              />
            </mesh>
          </group>
        );

      case 'heater':
        return (
          <group>
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            {[...Array(5)].map((_, i) => (
              <mesh key={i} position={[(i - 2) * 0.08, 0, depth / 2 + 0.01]}>
                <boxGeometry args={[0.02, height * 0.7, 0.01]} />
                <meshStandardMaterial 
                  color={isOn ? colors.on : '#555555'}
                  emissive={isOn ? colors.on : undefined}
                  emissiveIntensity={isOn ? 0.5 : 0}
                />
              </mesh>
            ))}
          </group>
        );

      default:
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={deviceColor} />
          </mesh>
        );
    }
  };

  return (
    <group position={offset} rotation={[0, rotation, 0]} onClick={handleClick}>
      {renderByType()}
    </group>
  );
};

export default Device;
