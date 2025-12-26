import { useMemo, useRef } from 'react';
import { Color, Mesh } from 'three';
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
            {/* 灯泡/光晕 */}
            <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial 
                color={deviceColor} 
                emissive={isOn ? deviceColor : undefined}
                emissiveIntensity={isOn ? 0.5 : 0}
              />
            </mesh>
            {isOn && (
              <pointLight position={[0, -0.2, 0]} intensity={1} distance={5} color={colors.on} />
            )}
          </group>
        );

      case 'ac':
        return (
          <group>
            {/* 空调主体 */}
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* 出风口 */}
            <mesh position={[0, -height / 2 + 0.02, depth / 2 - 0.02]}>
              <boxGeometry args={[width * 0.8, 0.04, 0.02]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            {/* 指示灯 */}
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
            {/* 风扇头 */}
            <mesh position={[0, height / 2 - 0.2, 0.1]}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            {/* 扇叶 */}
            <mesh position={[0, height / 2 - 0.2, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.15, 0.02, 8, 16]} />
              <meshStandardMaterial color={isOn ? '#87CEEB' : '#888888'} />
            </mesh>
          </group>
        );

      case 'curtain':
        return (
          <group>
            {/* 窗帘杆 */}
            <mesh position={[0, height / 2 - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, depth, 8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* 窗帘布 */}
            <mesh position={[0, isOn ? 0 : height / 4, 0]}>
              <boxGeometry args={[width, isOn ? height : height / 2, depth]} />
              <meshStandardMaterial 
                color={deviceColor} 
                transparent 
                opacity={0.8}
              />
            </mesh>
          </group>
        );

      case 'tv':
        return (
          <group>
            {/* 电视屏幕 */}
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial 
                color={isOn ? '#1a1a2e' : '#0a0a0a'}
              />
            </mesh>
            {/* 屏幕内容 */}
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
            {/* 指示灯环 */}
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
            {/* 主体 */}
            <mesh>
              <cylinderGeometry args={[width / 2, width / 2, height * 0.7, 16]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* 出雾口 */}
            <mesh position={[0, height / 2 - 0.1, 0]}>
              <cylinderGeometry args={[0.05, 0.08, 0.1, 16]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            {/* 水雾效果 */}
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
            {/* 主体 */}
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* 出风口 */}
            <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.01]}>
              <boxGeometry args={[width * 0.6, 0.15, 0.02]} />
              <meshStandardMaterial color={deviceColor} />
            </mesh>
            {/* 指示灯 */}
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
            {/* 主体 */}
            <mesh>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            {/* 发热片 */}
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
