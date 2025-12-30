import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { JSX } from 'react';

type FanProps = JSX.IntrinsicElements['group'] & {
  on: boolean;
  scale?: number | [number, number, number];
};

export function FanA({ on, scale = 0.005, ...props }: FanProps) {
  const { scene } = useGLTF('/models/desk_fan__rigged__free.glb');
  
  // 克隆 scene 以避免多个实例共享同一对象
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // 将 scale 转换为数组格式
  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group {...props}>
      <primitive object={clonedScene} scale={scaleArray} />
    </group>
  );
}

// 预加载模型
useGLTF.preload('/models/desk_fan__rigged__free.glb');
