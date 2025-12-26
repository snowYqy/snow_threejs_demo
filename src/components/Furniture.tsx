import { useMemo } from 'react';
import { Color } from 'three';
import type { FurnitureConfig } from '../data/floorPlanData';

interface FurnitureProps {
  furniture: FurnitureConfig;
  roomPosition: [number, number, number];
}

/**
 * Furniture组件 - 渲染单个家具
 */
export const Furniture: React.FC<FurnitureProps> = ({ furniture, roomPosition }) => {
  const { position, size, color, type } = furniture;
  const [width, height, depth] = size;

  // 计算家具在世界坐标中的位置
  const worldPosition: [number, number, number] = [
    position[0],
    position[1] - roomPosition[1] + height / 2,
    position[2],
  ];

  const furnitureColor = useMemo(() => new Color(color), [color]);

  // 根据家具类型渲染不同形状
  const renderFurniture = () => {
    switch (type) {
      case 'bed':
        return (
          <group position={worldPosition}>
            {/* 床垫 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width, height * 0.6, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 床头 */}
            <mesh position={[0, height * 0.3, -depth / 2 + 0.1]}>
              <boxGeometry args={[width, height * 0.8, 0.15]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
            </mesh>
            {/* 枕头 */}
            <mesh position={[0, height * 0.4, -depth / 2 + 0.4]}>
              <boxGeometry args={[width * 0.7, 0.15, 0.4]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          </group>
        );

      case 'sofa':
        return (
          <group position={worldPosition}>
            {/* 座垫 */}
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[width, height * 0.5, depth * 0.7]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 靠背 */}
            <mesh position={[0, height * 0.3, -depth / 2 + 0.15]}>
              <boxGeometry args={[width, height * 0.8, 0.3]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.9)} />
            </mesh>
            {/* 扶手 */}
            <mesh position={[-width / 2 + 0.1, height * 0.1, 0]}>
              <boxGeometry args={[0.2, height * 0.6, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.85)} />
            </mesh>
            <mesh position={[width / 2 - 0.1, height * 0.1, 0]}>
              <boxGeometry args={[0.2, height * 0.6, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.85)} />
            </mesh>
          </group>
        );

      case 'table':
        return (
          <group position={worldPosition}>
            {/* 桌面 */}
            <mesh position={[0, height / 2 - 0.05, 0]}>
              <boxGeometry args={[width, 0.1, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 桌腿 */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
              <mesh key={i} position={[x * (width / 2 - 0.1), 0, z * (depth / 2 - 0.1)]}>
                <boxGeometry args={[0.08, height - 0.1, 0.08]} />
                <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
              </mesh>
            ))}
          </group>
        );

      case 'chair':
        return (
          <group position={worldPosition}>
            {/* 座面 */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width, 0.08, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 靠背 */}
            <mesh position={[0, height * 0.4, -depth / 2 + 0.05]}>
              <boxGeometry args={[width * 0.9, height * 0.8, 0.08]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 椅腿 */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
              <mesh key={i} position={[x * (width / 2 - 0.05), -height / 2, z * (depth / 2 - 0.05)]}>
                <boxGeometry args={[0.05, height, 0.05]} />
                <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.7)} />
              </mesh>
            ))}
          </group>
        );

      case 'cabinet':
      case 'fridge':
        return (
          <mesh position={worldPosition}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={furnitureColor} />
          </mesh>
        );

      case 'toilet':
        return (
          <group position={worldPosition}>
            {/* 底座 */}
            <mesh position={[0, -height * 0.2, 0]}>
              <boxGeometry args={[width, height * 0.4, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 水箱 */}
            <mesh position={[0, height * 0.1, -depth / 2 + 0.15]}>
              <boxGeometry args={[width * 0.8, height * 0.5, 0.25]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
          </group>
        );

      case 'sink':
      case 'stove':
        return (
          <group position={worldPosition}>
            {/* 柜体 */}
            <mesh position={[0, -height * 0.25, 0]}>
              <boxGeometry args={[width, height * 0.5, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.9)} />
            </mesh>
            {/* 台面 */}
            <mesh position={[0, height * 0.05, 0]}>
              <boxGeometry args={[width, 0.1, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
          </group>
        );

      case 'desk':
        return (
          <group position={worldPosition}>
            {/* 桌面 */}
            <mesh position={[0, height / 2 - 0.05, 0]}>
              <boxGeometry args={[width, 0.08, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {/* 桌腿 */}
            <mesh position={[-width / 2 + 0.1, 0, 0]}>
              <boxGeometry args={[0.08, height - 0.1, depth * 0.8]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
            </mesh>
            <mesh position={[width / 2 - 0.1, 0, 0]}>
              <boxGeometry args={[0.08, height - 0.1, depth * 0.8]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh position={worldPosition}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={furnitureColor} />
          </mesh>
        );
    }
  };

  return renderFurniture();
};

export default Furniture;
