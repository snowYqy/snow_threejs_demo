import { useMemo } from 'react';
import { Color } from 'three';
import type { FurnitureData } from '../types/homeData';
import { getFurnitureOffset, getFurnitureSize } from '../data/homeDataLoader';

interface FurnitureProps {
  data: FurnitureData;
  wallHeight: number;
}

/**
 * Furniture组件 - 根据数据渲染家具
 */
export const Furniture: React.FC<FurnitureProps> = ({ data, wallHeight }) => {
  const offset = getFurnitureOffset(data, wallHeight);
  const [width, height, depth] = getFurnitureSize(data);
  const rotation = (data.rotation ?? 0) * Math.PI / 180;

  const furnitureColor = useMemo(() => new Color(data.color), [data.color]);

  const renderByType = () => {
    switch (data.type) {
      case 'bed':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width, height * 0.6, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            <mesh position={[0, height * 0.3, -depth / 2 + 0.1]}>
              <boxGeometry args={[width, height * 0.8, 0.15]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
            </mesh>
            <mesh position={[0, height * 0.35, -depth / 2 + 0.4]}>
              <boxGeometry args={[width * 0.7, 0.15, 0.4]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          </group>
        );

      case 'sofa':
        return (
          <group>
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[width, height * 0.5, depth * 0.7]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            <mesh position={[0, height * 0.25, -depth / 2 + 0.15]}>
              <boxGeometry args={[width, height * 0.7, 0.3]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.9)} />
            </mesh>
            <mesh position={[-width / 2 + 0.1, 0, 0]}>
              <boxGeometry args={[0.2, height * 0.5, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.85)} />
            </mesh>
            <mesh position={[width / 2 - 0.1, 0, 0]}>
              <boxGeometry args={[0.2, height * 0.5, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.85)} />
            </mesh>
          </group>
        );

      case 'table':
      case 'desk':
        return (
          <group>
            <mesh position={[0, height / 2 - 0.04, 0]}>
              <boxGeometry args={[width, 0.08, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
              <mesh key={i} position={[x * (width / 2 - 0.08), 0, z * (depth / 2 - 0.08)]}>
                <boxGeometry args={[0.06, height - 0.08, 0.06]} />
                <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.8)} />
              </mesh>
            ))}
          </group>
        );

      case 'chair':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width, 0.06, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            <mesh position={[0, height * 0.35, -depth / 2 + 0.04]}>
              <boxGeometry args={[width * 0.9, height * 0.7, 0.06]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
              <mesh key={i} position={[x * (width / 2 - 0.04), -height * 0.35, z * (depth / 2 - 0.04)]}>
                <boxGeometry args={[0.04, height * 0.7, 0.04]} />
                <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.7)} />
              </mesh>
            ))}
          </group>
        );

      case 'cabinet':
      case 'fridge':
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={furnitureColor} />
          </mesh>
        );

      case 'toilet':
        return (
          <group>
            <mesh position={[0, -height * 0.2, 0]}>
              <boxGeometry args={[width, height * 0.4, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
            <mesh position={[0, height * 0.1, -depth / 2 + 0.12]}>
              <boxGeometry args={[width * 0.8, height * 0.5, 0.2]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
          </group>
        );

      case 'sink':
      case 'stove':
        return (
          <group>
            <mesh position={[0, -height * 0.2, 0]}>
              <boxGeometry args={[width, height * 0.6, depth]} />
              <meshStandardMaterial color={furnitureColor.clone().multiplyScalar(0.9)} />
            </mesh>
            <mesh position={[0, height * 0.15, 0]}>
              <boxGeometry args={[width, 0.08, depth]} />
              <meshStandardMaterial color={furnitureColor} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={furnitureColor} />
          </mesh>
        );
    }
  };

  return (
    <group position={offset} rotation={[0, rotation, 0]}>
      {renderByType()}
    </group>
  );
};

export default Furniture;
