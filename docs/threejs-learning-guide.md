# Three.js + React 快速学习指南

> 基于本项目实战经验总结，帮助你快速掌握 Three.js 在 React 中的应用

## 目录

1. [核心概念](#核心概念)
2. [React Three Fiber 基础](#react-three-fiber-基础)
3. [几何体与材质](#几何体与材质)
4. [灯光系统](#灯光系统)
5. [相机与控制器](#相机与控制器)
6. [动画与交互](#动画与交互)
7. [性能优化](#性能优化)
8. [米家风格最佳实践](#米家风格最佳实践)

---

## 核心概念

### Three.js 三要素

```
场景 (Scene) + 相机 (Camera) + 渲染器 (Renderer) = 3D 世界
```

| 概念 | 作用 | 类比 |
|------|------|------|
| Scene | 容纳所有 3D 对象的容器 | 舞台 |
| Camera | 决定从哪个角度看场景 | 眼睛/摄像机 |
| Renderer | 将场景渲染到屏幕 | 画布 |
| Mesh | 几何体 + 材质 = 可见物体 | 演员 |
| Light | 照亮场景 | 灯光 |

### 坐标系

```
      Y (上)
      |
      |
      +------ X (右)
     /
    /
   Z (前/朝向屏幕)
```

---

## React Three Fiber 基础

### 为什么用 React Three Fiber？

- 声明式语法，像写 React 组件一样写 3D
- 自动处理渲染循环、清理资源
- 与 React 生态无缝集成

### 基础结构

```tsx
import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
    >
      {/* 灯光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      
      {/* 3D 对象 */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
}
```

### Canvas 常用配置

```tsx
<Canvas
  camera={{
    position: [15, 15, 15],  // 相机位置
    fov: 50,                  // 视野角度
    near: 0.1,                // 近裁剪面
    far: 1000,                // 远裁剪面
  }}
  gl={{
    antialias: true,                           // 抗锯齿
    toneMapping: THREE.ACESFilmicToneMapping,  // 色调映射
    toneMappingExposure: 1.0,                  // 曝光度
  }}
  onCreated={({ gl }) => {
    gl.outputColorSpace = THREE.SRGBColorSpace; // 颜色空间
  }}
>
```

---

## 几何体与材质

### 常用几何体

```tsx
// 立方体
<boxGeometry args={[宽, 高, 深]} />

// 球体
<sphereGeometry args={[半径, 水平分段, 垂直分段]} />

// 圆柱体
<cylinderGeometry args={[顶部半径, 底部半径, 高度, 分段数]} />

// 圆锥体
<coneGeometry args={[半径, 高度, 分段数]} />

// 平面
<planeGeometry args={[宽, 高]} />

// 圆环
<torusGeometry args={[半径, 管道半径, 管道分段, 环分段]} />
```

### 材质类型

| 材质 | 特点 | 使用场景 |
|------|------|----------|
| `MeshBasicMaterial` | 不受光照影响 | 光晕、UI元素 |
| `MeshStandardMaterial` | PBR材质，真实感 | 大多数物体 |
| `MeshPhysicalMaterial` | 更高级的PBR | 玻璃、金属 |

### PBR 材质参数

```tsx
<meshStandardMaterial
  color="#FFFFFF"        // 基础颜色
  roughness={0.6}        // 粗糙度 0-1 (0=镜面, 1=粗糙)
  metalness={0.0}        // 金属度 0-1 (0=非金属, 1=金属)
  emissive="#FFF4CC"     // 自发光颜色
  emissiveIntensity={1.2} // 自发光强度
  transparent={true}     // 是否透明
  opacity={0.5}          // 透明度
/>
```

### 实际示例：灯泡

```tsx
// 关闭状态
<meshStandardMaterial 
  color="#B0B0B0" 
  roughness={0.2}
/>

// 开启状态 - 使用 emissive 发光
<meshStandardMaterial 
  color="#FFFEF5" 
  emissive={new Color('#FFF4CC')}
  emissiveIntensity={1.8}
  roughness={0.2}
/>
```

---

## 灯光系统

### 灯光类型

| 类型 | 描述 | 性能 |
|------|------|------|
| `AmbientLight` | 环境光，均匀照亮所有物体 | 最低 |
| `DirectionalLight` | 平行光，模拟太阳 | 中等 |
| `PointLight` | 点光源，向四周发光 | 较高 |
| `SpotLight` | 聚光灯，锥形光束 | 最高 |

### 米家风格灯光配置

```tsx
// ❌ 错误：灯光太亮太平
<ambientLight intensity={1.5} />
<directionalLight intensity={1.5} />

// ✅ 正确：少而精的灯光组合
// 1. 环境光 - 低强度
<ambientLight intensity={0.15} color="#e8e8f0" />

// 2. 主光 - 暖色调，模拟天光
<directionalLight 
  position={[10, 15, 10]} 
  intensity={1.2} 
  color="#fff1d0"
/>

// 3. 补光 - 消除死黑
<directionalLight 
  position={[-8, 6, -8]} 
  intensity={0.5} 
  color="#f0f0ff"
/>
```

### 设备灯光 vs 场景灯光

```tsx
// 场景灯光：照亮整个场景
<directionalLight position={[10, 15, 10]} intensity={1.2} />

// 设备灯光：灯具自身发光效果
// 使用 emissive 材质 + 小范围 pointLight
<mesh>
  <sphereGeometry args={[0.12, 32, 32]} />
  <meshStandardMaterial 
    emissive={new Color('#FFF4CC')}
    emissiveIntensity={1.8}
  />
</mesh>
<pointLight intensity={2.5} distance={6} color="#FFF5E6" />
```

---

## 相机与控制器

### OrbitControls

```tsx
import { OrbitControls } from '@react-three/drei';

<OrbitControls
  enableRotate={true}      // 允许旋转
  enableZoom={true}        // 允许缩放
  enablePan={true}         // 允许平移
  minDistance={5}          // 最小缩放距离
  maxDistance={50}         // 最大缩放距离
  minPolarAngle={0.1}      // 最小垂直角度
  maxPolarAngle={Math.PI / 2.1}  // 最大垂直角度（防止翻转到底部）
  target={[0, 0, 0]}       // 观察目标点
  enableDamping={true}     // 阻尼效果
  dampingFactor={0.05}     // 阻尼系数
/>
```

---

## 动画与交互

### useFrame - 每帧更新

```tsx
import { useFrame } from '@react-three/fiber';

function RotatingBox() {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta; // 每帧旋转
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}
```

### 实际示例：风扇旋转

```tsx
const Fan = ({ isOn }) => {
  const bladeRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (bladeRef.current && isOn) {
      bladeRef.current.rotation.z += delta * 10; // 旋转速度
    }
  });

  return (
    <mesh ref={bladeRef}>
      {/* 扇叶 */}
    </mesh>
  );
};
```

### 点击交互

```tsx
<mesh
  onClick={(e) => {
    e.stopPropagation(); // 阻止事件冒泡
    console.log('clicked!');
  }}
  onPointerOver={(e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  }}
  onPointerOut={(e) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
  }}
>
```

---

## 性能优化

### 1. useMemo 缓存计算

```tsx
const walls = useMemo(() => generateWalls(rooms), [rooms]);
const color = useMemo(() => new Color('#FFFFFF'), []);
```

### 2. 减少几何体分段数

```tsx
// 开发时可以用低分段
<sphereGeometry args={[0.12, 16, 16]} />

// 生产环境用高分段
<sphereGeometry args={[0.12, 32, 32]} />
```

### 3. 合理使用阴影

```tsx
// 只在必要的物体上启用阴影
<mesh castShadow receiveShadow>  {/* 投射和接收阴影 */}
<mesh receiveShadow>             {/* 只接收阴影（地面） */}
```

### 4. 灯光数量控制

- 场景灯光：2-3 盏足够
- 设备灯光：按需添加，注意 `distance` 限制范围

---

## 米家风格最佳实践

### 渲染器配置

```tsx
gl={{
  antialias: true,
  toneMapping: THREE.ACESFilmicToneMapping,  // 电影级色调
  toneMappingExposure: 1.0,
}}
onCreated={({ gl }) => {
  gl.outputColorSpace = THREE.SRGBColorSpace; // 正确颜色空间
}}
```

### 参数参考表

| 项目 | 推荐值 |
|------|--------|
| AmbientLight | 0.1–0.2 |
| DirectionalLight | 1.0–1.5 |
| roughness | 0.6–0.85 |
| metalness | 0–0.1 |
| emissiveIntensity | 0.8–1.8 |
| 背景色 | #F5F7FA |

### 材质风格

```tsx
// 地板
<meshStandardMaterial color="#E8D5C4" roughness={0.75} metalness={0} />

// 墙体
<meshStandardMaterial 
  color="#F0F4F8" 
  transparent 
  opacity={0.45}
  roughness={0.7} 
  metalness={0} 
/>

// 白色设备外壳
<meshStandardMaterial color="#FAFAFA" roughness={0.6} metalness={0} />
```

### 灯具发光效果

```tsx
// 核心：使用 emissive 而不是大量光晕层
<meshStandardMaterial 
  color="#FFFEF5"
  emissive={new Color('#FFF4CC')}
  emissiveIntensity={isOn ? 1.8 : 0}  // 开关控制
/>

// 配合少量柔和光晕
{isOn && (
  <>
    <mesh>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshBasicMaterial color="#FFF8E7" transparent opacity={0.35} />
    </mesh>
    <pointLight intensity={2.5} distance={6} color="#FFF5E6" decay={2} />
  </>
)}
```

---

## 项目结构参考

```
src/
├── components/
│   ├── Scene3D.tsx      # Canvas + 灯光 + 控制器
│   ├── FloorPlan.tsx    # 房间布局 + 墙体生成
│   ├── Room.tsx         # 单个房间（地板 + 设备）
│   ├── Device.tsx       # 智能设备渲染
│   └── UI.tsx           # 2D 控制面板
├── store/
│   └── useHomeStore.ts  # Zustand 状态管理
├── types/
│   └── homeData.ts      # 类型定义
└── data/
    └── homeDataLoader.ts # 数据加载工具
```

---

## 学习资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [Drei 辅助库](https://github.com/pmndrs/drei)
- [Three.js Journey 教程](https://threejs-journey.com/)

---

## 快速调试技巧

```tsx
// 1. 添加坐标轴辅助
<axesHelper args={[5]} />

// 2. 添加网格辅助
<gridHelper args={[20, 20]} />

// 3. 查看物体边界
import { Edges } from '@react-three/drei';
<mesh>
  <boxGeometry />
  <meshStandardMaterial />
  <Edges color="red" />
</mesh>

// 4. 使用 Leva 调试面板
import { useControls } from 'leva';
const { intensity } = useControls({ intensity: { value: 1, min: 0, max: 5 } });
```
