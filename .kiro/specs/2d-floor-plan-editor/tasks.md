# Implementation Tasks

## Task 1: 数据模型层

### Subtask 1.1: 创建类型定义
- **File**: `src/editor/types.ts`
- **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5
- **Acceptance Criteria**:
  - [ ] 定义 Vertex 接口 (id, x, y)
  - [ ] 定义 Wall 接口 (id, startVertexId, endVertexId, thickness)
  - [ ] 定义 Room 接口 (id, vertexIds, color, name)
  - [ ] 定义 Door 接口 (id, wallId, position, width, direction)
  - [ ] 定义 Window 接口 (id, wallId, position, width, height)
  - [ ] 定义 ToolType 类型
  - [ ] 定义 EditorError 接口

### Subtask 1.2: 创建 Zustand Store
- **File**: `src/editor/store/useEditorStore.ts`
- **Requirements**: 1.6
- **Acceptance Criteria**:
  - [ ] 创建 EditorState 接口
  - [ ] 实现数据存储 (vertices, walls, rooms, doors, windows)
  - [ ] 实现 UI 状态 (activeTool, selectedIds, hoveredId, errors)
  - [ ] 实现绘制状态 (drawingVertexId)
  - [ ] 实现基础 actions (setActiveTool, addVertex, addWall, deleteWall)

## Task 2: 几何计算引擎

### Subtask 2.1: 基础几何函数
- **File**: `src/editor/engine/geometry.ts`
- **Requirements**: 4.1, 4.2
- **Acceptance Criteria**:
  - [ ] 实现 buildGraph() - 将墙体转换为图结构
  - [ ] 实现 calculatePolygonArea() - 计算多边形面积
  - [ ] 实现 isPointInPolygon() - 判断点是否在多边形内
  - [ ] 实现 findNearestVertex() - 查找最近顶点（吸附）
  - [ ] 实现 doLinesIntersect() - 检测线段相交

### Subtask 2.2: 闭环检测算法
- **File**: `src/editor/engine/geometry.ts`
- **Requirements**: 4.1, 4.2
- **Acceptance Criteria**:
  - [ ] 实现 findAllCycles() - 查找所有闭合环
  - [ ] 实现最小环检测（避免嵌套环）
  - [ ] 返回顺时针排列的顶点序列

## Task 3: 规则引擎

### Subtask 3.1: 墙体校验
- **File**: `src/editor/engine/rules.ts`
- **Requirements**: 4.3, 4.4, 4.5
- **Acceptance Criteria**:
  - [ ] 实现 validateWalls() - 校验墙体连接性
  - [ ] 检测未闭合墙体
  - [ ] 检测自相交墙体

### Subtask 3.2: 门窗校验
- **File**: `src/editor/engine/rules.ts`
- **Requirements**: 6.4, 6.5, 6.6
- **Acceptance Criteria**:
  - [ ] 实现 validateDoorsAndWindows()
  - [ ] 校验门窗宽度不超过墙体长度
  - [ ] 校验门窗不能太靠近墙体端点

## Task 4: 工具系统

### Subtask 4.1: 工具基础架构
- **File**: `src/editor/tools/types.ts`
- **Requirements**: 2.6
- **Acceptance Criteria**:
  - [ ] 定义 Tool 接口
  - [ ] 定义 ToolContext 接口
  - [ ] 创建工具注册机制

### Subtask 4.2: 选择工具
- **File**: `src/editor/tools/SelectTool.ts`
- **Requirements**: 2.1
- **Acceptance Criteria**:
  - [ ] 实现点击选择顶点/墙体
  - [ ] 实现拖拽移动顶点
  - [ ] 实现多选功能

### Subtask 4.3: 绘制墙体工具
- **File**: `src/editor/tools/DrawWallTool.ts`
- **Requirements**: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5
- **Acceptance Criteria**:
  - [ ] 实现点击创建顶点
  - [ ] 实现连续绘制墙体
  - [ ] 实现顶点吸附
  - [ ] 实现 Escape 取消绘制

### Subtask 4.4: 删除工具
- **File**: `src/editor/tools/DeleteTool.ts`
- **Requirements**: 2.3
- **Acceptance Criteria**:
  - [ ] 实现点击删除墙体
  - [ ] 实现删除门窗
  - [ ] 级联删除孤立顶点

### Subtask 4.5: 门窗工具
- **File**: `src/editor/tools/DoorTool.ts`, `src/editor/tools/WindowTool.ts`
- **Requirements**: 2.4, 2.5, 6.1, 6.2, 6.3
- **Acceptance Criteria**:
  - [ ] 实现墙体悬停高亮
  - [ ] 实现点击添加门/窗
  - [ ] 实现拖拽调整位置

## Task 5: Konva 渲染层

### Subtask 5.1: 画布基础组件
- **File**: `src/editor/components/EditorCanvas.tsx`
- **Requirements**: 8.1
- **Acceptance Criteria**:
  - [ ] 创建 Stage 组件
  - [ ] 实现画布缩放和平移
  - [ ] 设置分层结构

### Subtask 5.2: 网格层
- **File**: `src/editor/components/layers/GridLayer.tsx`
- **Requirements**: 8.2
- **Acceptance Criteria**:
  - [ ] 渲染背景网格
  - [ ] 支持缩放时网格密度调整

### Subtask 5.3: 房间层
- **File**: `src/editor/components/layers/RoomLayer.tsx`
- **Requirements**: 5.1, 5.2, 5.3, 5.4, 8.3
- **Acceptance Criteria**:
  - [ ] 渲染房间多边形
  - [ ] 实现半透明填充
  - [ ] 实现选中高亮

### Subtask 5.4: 墙体层
- **File**: `src/editor/components/layers/WallLayer.tsx`
- **Requirements**: 7.1, 8.4
- **Acceptance Criteria**:
  - [ ] 渲染墙体线段
  - [ ] 渲染顶点
  - [ ] 未闭合墙体显示红色

### Subtask 5.5: 门窗层
- **File**: `src/editor/components/layers/DoorWindowLayer.tsx`
- **Requirements**: 7.2, 8.5
- **Acceptance Criteria**:
  - [ ] 渲染门（带开门方向弧线）
  - [ ] 渲染窗户
  - [ ] 错误状态显示

### Subtask 5.6: 交互层
- **File**: `src/editor/components/layers/InteractionLayer.tsx`
- **Requirements**: 8.6
- **Acceptance Criteria**:
  - [ ] 渲染选择框
  - [ ] 渲染悬停效果
  - [ ] 渲染绘制预览线

## Task 6: UI 组件

### Subtask 6.1: 工具栏
- **File**: `src/editor/components/Toolbar.tsx`
- **Requirements**: 2.6
- **Acceptance Criteria**:
  - [ ] 显示所有工具按钮
  - [ ] 高亮当前工具
  - [ ] 工具切换功能

### Subtask 6.2: 错误面板
- **File**: `src/editor/components/ErrorPanel.tsx`
- **Requirements**: 7.3, 7.4
- **Acceptance Criteria**:
  - [ ] 显示错误列表
  - [ ] 点击错误定位到元素
  - [ ] 有错误时禁用导出

### Subtask 6.3: 主编辑器组件
- **File**: `src/editor/FloorPlanEditor.tsx`
- **Acceptance Criteria**:
  - [ ] 组合所有子组件
  - [ ] 集成工具系统
  - [ ] 键盘快捷键支持

## Task 7: 集成与测试

### Subtask 7.1: 单元测试
- **File**: `src/editor/__tests__/geometry.test.ts`
- **Acceptance Criteria**:
  - [ ] 测试几何计算函数
  - [ ] 测试闭环检测
  - [ ] 测试规则校验

### Subtask 7.2: 集成到主应用
- **File**: `src/App.tsx`
- **Acceptance Criteria**:
  - [ ] 添加编辑器路由/入口
  - [ ] 实现编辑器与 3D 视图切换
