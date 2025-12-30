# Requirements Document

## Introduction

基于 Konva 实现的 2D 户型编辑器，支持墙体绘制、门窗添加、封闭区域检测和房间着色。编辑器采用分层架构，将数据模型、工具系统、规则引擎、几何计算和渲染层分离。

## Glossary

- **Editor**: 2D 户型编辑器主组件
- **Wall**: 墙体，由两个顶点连接的线段
- **Vertex**: 墙体端点，可被多个墙体共享
- **Room**: 由墙体围成的封闭区域
- **Door**: 门，附着在墙体上的开口
- **Window**: 窗户，附着在墙体上的开口
- **Tool**: 编辑工具，控制用户交互行为
- **RuleEngine**: 规则引擎，校验户型数据的合法性
- **GeometryEngine**: 几何计算引擎，处理闭环检测和多边形计算

## Requirements

### Requirement 1: 数据模型层

**User Story:** As a developer, I want a clean data model layer, so that the editor logic is separated from the view layer.

#### Acceptance Criteria

1. THE Editor SHALL define Vertex data structure with id, x, y coordinates
2. THE Editor SHALL define Wall data structure with id, startVertexId, endVertexId
3. THE Editor SHALL define Room data structure with id, vertexIds array, color
4. THE Editor SHALL define Door data structure with id, wallId, position, width
5. THE Editor SHALL define Window data structure with id, wallId, position, width, height
6. THE Editor SHALL use Zustand store to manage all floor plan data

### Requirement 2: 工具系统

**User Story:** As a user, I want to switch between different editing tools, so that I can perform various operations on the floor plan.

#### Acceptance Criteria

1. WHEN user selects Select tool, THE Editor SHALL allow selecting and moving vertices and walls
2. WHEN user selects DrawWall tool, THE Editor SHALL allow drawing walls by clicking two points
3. WHEN user selects Delete tool, THE Editor SHALL allow deleting walls, doors, and windows
4. WHEN user selects Door tool, THE Editor SHALL allow adding doors to walls
5. WHEN user selects Window tool, THE Editor SHALL allow adding windows to walls
6. THE Editor SHALL display current active tool in the toolbar

### Requirement 3: 墙体绘制

**User Story:** As a user, I want to draw walls on the canvas, so that I can create the floor plan layout.

#### Acceptance Criteria

1. WHEN user clicks on canvas with DrawWall tool, THE Editor SHALL create a new vertex at click position
2. WHEN user clicks second point, THE Editor SHALL create a wall connecting the two vertices
3. WHEN user clicks near existing vertex (within snap distance), THE Editor SHALL snap to that vertex
4. WHEN user draws continuous walls, THE Editor SHALL automatically connect to the last vertex
5. WHEN user presses Escape, THE Editor SHALL cancel current wall drawing

### Requirement 4: 墙体封闭校验

**User Story:** As a user, I want the editor to detect closed areas, so that I can see which areas form valid rooms.

#### Acceptance Criteria

1. WHEN walls form a closed polygon, THE GeometryEngine SHALL detect the closed cycle
2. WHEN closed cycle is detected, THE Editor SHALL create a Room from the cycle
3. WHEN wall is not part of any closed cycle, THE Editor SHALL mark it as unclosed (error state)
4. THE RuleEngine SHALL validate that walls are connected (no floating walls)
5. THE RuleEngine SHALL validate that walls do not self-intersect

### Requirement 5: 封闭区域着色

**User Story:** As a user, I want closed areas to be colored differently, so that I can visually distinguish rooms.

#### Acceptance Criteria

1. WHEN a Room is created, THE Editor SHALL assign a unique color to it
2. THE Editor SHALL render Room polygons with semi-transparent fill
3. THE Editor SHALL render Room polygons below wall layer
4. WHEN Room is selected, THE Editor SHALL highlight it with different opacity

### Requirement 6: 门窗编辑

**User Story:** As a user, I want to add doors and windows to walls, so that I can complete the floor plan design.

#### Acceptance Criteria

1. WHEN user hovers over wall with Door tool, THE Editor SHALL highlight the wall
2. WHEN user clicks on wall with Door tool, THE Editor SHALL add a door at click position
3. WHEN user drags door along wall, THE Editor SHALL move the door position
4. THE RuleEngine SHALL validate door width is less than wall length
5. THE RuleEngine SHALL validate door is not too close to wall endpoints
6. IF door position is invalid, THEN THE Editor SHALL show error indicator

### Requirement 7: 错误系统

**User Story:** As a user, I want to see validation errors, so that I can fix issues in my floor plan.

#### Acceptance Criteria

1. WHEN wall is unclosed, THE Editor SHALL render it with red color
2. WHEN door/window position is invalid, THE Editor SHALL show error tooltip
3. THE Editor SHALL display error list in a panel
4. WHEN errors exist, THE Editor SHALL disable export to 3D function

### Requirement 8: Konva 渲染层

**User Story:** As a developer, I want proper layer organization, so that rendering is efficient and maintainable.

#### Acceptance Criteria

1. THE Editor SHALL use separate Konva Layers for: Grid, Room, Wall, DoorWindow, Interaction
2. THE Editor SHALL render grid on the bottom layer
3. THE Editor SHALL render rooms above grid but below walls
4. THE Editor SHALL render walls above rooms
5. THE Editor SHALL render doors and windows above walls
6. THE Editor SHALL use Interaction layer for selection and hover effects
