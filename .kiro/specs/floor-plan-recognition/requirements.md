# Requirements Document

## Introduction

本功能允许用户上传 2D 户型图图片，系统自动识别房间布局、墙体、门窗等元素，生成符合 homeData.json 格式的结构化数据，最终通过现有的 Three.js 渲染引擎生成 3D 智能家居模型。

## Glossary

- **Floor_Plan_Image**: 用户上传的 2D 户型图图片（PNG/JPG/JPEG）
- **Recognition_Engine**: 图像识别引擎，负责分析户型图并提取结构化数据
- **HomeData**: 符合现有 homeData.json 格式的房间布局数据结构
- **Room_Detector**: 房间检测模块，识别独立房间区域
- **Wall_Detector**: 墙体检测模块，识别墙体位置和厚度
- **Label_Extractor**: 标签提取模块，识别房间名称文字
- **Scale_Calculator**: 比例计算模块，将像素坐标转换为实际米制单位

## Requirements

### Requirement 1: 图片上传

**User Story:** As a user, I want to upload a 2D floor plan image, so that I can convert it to a 3D model.

#### Acceptance Criteria

1. WHEN a user clicks the upload button, THE System SHALL open a file picker dialog
2. THE System SHALL accept PNG, JPG, and JPEG image formats
3. WHEN an invalid file format is uploaded, THE System SHALL display an error message
4. THE System SHALL display a preview of the uploaded image
5. THE System SHALL limit file size to 10MB maximum
6. IF the file exceeds 10MB, THEN THE System SHALL reject the upload and notify the user

### Requirement 2: 图像预处理

**User Story:** As a system, I want to preprocess the uploaded image, so that recognition accuracy is improved.

#### Acceptance Criteria

1. WHEN an image is uploaded, THE Preprocessor SHALL convert it to grayscale
2. THE Preprocessor SHALL apply noise reduction filtering
3. THE Preprocessor SHALL enhance contrast for better edge detection
4. THE Preprocessor SHALL detect and correct image rotation if skewed
5. THE Preprocessor SHALL normalize image resolution for consistent processing

### Requirement 3: 墙体检测

**User Story:** As a system, I want to detect walls in the floor plan, so that room boundaries can be determined.

#### Acceptance Criteria

1. THE Wall_Detector SHALL identify wall segments using edge detection
2. THE Wall_Detector SHALL distinguish between exterior and interior walls
3. THE Wall_Detector SHALL detect wall thickness
4. THE Wall_Detector SHALL output wall coordinates as line segments
5. WHEN walls form closed regions, THE Wall_Detector SHALL identify them as potential rooms

### Requirement 4: 房间识别

**User Story:** As a system, I want to identify individual rooms, so that I can generate room data.

#### Acceptance Criteria

1. THE Room_Detector SHALL identify enclosed areas as rooms
2. THE Room_Detector SHALL calculate room center position
3. THE Room_Detector SHALL calculate room dimensions (width, depth)
4. THE Room_Detector SHALL detect room shape (rectangular, L-shaped, etc.)
5. WHEN a room label is detected, THE Room_Detector SHALL associate it with the room

### Requirement 5: 文字标签识别

**User Story:** As a system, I want to extract text labels from the floor plan, so that rooms can be named correctly.

#### Acceptance Criteria

1. THE Label_Extractor SHALL use OCR to detect text in the image
2. THE Label_Extractor SHALL identify room type keywords (客厅, 卧室, 厨房, 卫生间, 阳台, etc.)
3. THE Label_Extractor SHALL associate labels with their nearest room
4. WHEN no label is detected for a room, THE System SHALL assign a default name based on size/position

### Requirement 6: 门窗检测

**User Story:** As a system, I want to detect doors and windows, so that wall openings can be represented.

#### Acceptance Criteria

1. THE Door_Detector SHALL identify door symbols (arc patterns, gaps in walls)
2. THE Window_Detector SHALL identify window symbols (parallel lines on walls)
3. THE System SHALL record door/window positions relative to walls
4. THE System SHALL estimate door/window dimensions

### Requirement 7: 比例转换

**User Story:** As a system, I want to convert pixel coordinates to real-world measurements, so that the 3D model has correct proportions.

#### Acceptance Criteria

1. THE Scale_Calculator SHALL detect scale indicators in the image if present
2. WHEN no scale is detected, THE System SHALL allow user to input a reference measurement
3. THE Scale_Calculator SHALL convert all pixel coordinates to meters
4. THE System SHALL normalize room sizes to reasonable real-world dimensions

### Requirement 8: 数据生成

**User Story:** As a system, I want to generate homeData JSON, so that the existing 3D renderer can use it.

#### Acceptance Criteria

1. THE Data_Generator SHALL output data matching the HomeData TypeScript interface
2. THE Data_Generator SHALL include meta information (version, name, wallHeight)
3. THE Data_Generator SHALL generate room array with id, name, type, position, size, color
4. THE Data_Generator SHALL assign appropriate room colors based on room type
5. THE Data_Generator SHALL initialize empty devices array for each room

### Requirement 9: 用户校正界面

**User Story:** As a user, I want to review and correct the recognition results, so that I can fix any errors.

#### Acceptance Criteria

1. THE System SHALL display recognized rooms overlaid on the original image
2. THE System SHALL allow users to adjust room boundaries by dragging
3. THE System SHALL allow users to rename rooms
4. THE System SHALL allow users to change room types
5. THE System SHALL allow users to add or remove rooms manually
6. WHEN user confirms, THE System SHALL generate final homeData

### Requirement 10: 3D 预览与导出

**User Story:** As a user, I want to preview the 3D model and export the data, so that I can use it in the smart home system.

#### Acceptance Criteria

1. THE System SHALL render a 3D preview using the existing FloorPlan component
2. THE System SHALL allow users to download the generated homeData.json
3. THE System SHALL allow users to apply the data directly to the current session
4. THE System SHALL provide a "regenerate" option to re-run recognition with different parameters
