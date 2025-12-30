# Implementation Plan: 2D 户型图识别转 3D 模型

## Overview

本计划分为 4 个阶段，从基础设施搭建到完整功能实现，预计总工时 3-4 周。

## Phase 1: 基础设施搭建 (Week 1)

- [x] 1. 搭建 Python 后端服务
  - [x] 1.1 初始化 FastAPI 项目结构
    - 创建 `backend/` 目录
    - 配置 FastAPI + uvicorn
    - 设置 CORS 允许前端访问
    - _Requirements: 基础架构_

  - [x] 1.2 配置 OpenCV 和 Tesseract 环境
    - 安装 opencv-python, pytesseract
    - 配置中文 OCR 语言包
    - 编写环境检测脚本
    - _Requirements: 2.1, 5.1_

  - [x] 1.3 实现图片上传 API
    - POST /api/upload 接收 base64 图片
    - 图片格式验证
    - 文件大小限制
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [x] 2. 前端上传组件
  - [x] 2.1 创建 ImageUploadPanel 组件
    - 文件选择器
    - 拖拽上传支持
    - 图片预览
    - _Requirements: 1.1, 1.4_

  - [x] 2.2 创建 RecognitionStore (Zustand)
    - 上传状态管理
    - 识别结果存储
    - 编辑状态管理
    - _Requirements: 状态管理_

## Phase 2: 核心识别算法 (Week 2)

- [x] 3. 图像预处理模块
  - [x] 3.1 实现图像预处理管道
    - 灰度转换
    - 噪声去除
    - 对比度增强
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 实现图像校正
    - 倾斜检测
    - 自动旋转校正
    - 分辨率归一化
    - _Requirements: 2.4, 2.5_

- [x] 4. 墙体检测模块
  - [x] 4.1 实现边缘检测
    - Canny 边缘检测
    - 霍夫线变换
    - 线段合并算法
    - _Requirements: 3.1, 3.4_

  - [x] 4.2 实现墙体分类
    - 外墙/内墙区分
    - 墙体厚度估算
    - _Requirements: 3.2, 3.3_

- [x] 5. 房间检测模块
  - [x] 5.1 实现轮廓检测
    - 封闭区域查找
    - 轮廓面积过滤
    - 边界矩形计算
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 实现房间形状分析
    - 矩形检测
    - L 型检测
    - 不规则形状处理
    - _Requirements: 4.4_

- [x] 6. Checkpoint - 核心算法验证
  - 使用测试图片验证墙体检测
  - 验证房间轮廓识别
  - 确保基础算法工作正常

## Phase 3: 智能识别增强 (Week 3)

- [x] 7. OCR 文字识别
  - [x] 7.1 实现文字检测
    - Tesseract OCR 集成
    - 中文识别配置
    - 文字位置提取
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 实现标签关联
    - 文字与房间匹配
    - 房间类型推断
    - 默认名称分配
    - _Requirements: 5.3, 5.4_

- [ ] 8. 门窗检测
  - [ ] 8.1 实现门检测
    - 弧形符号检测
    - 墙体缺口检测
    - 门位置记录
    - _Requirements: 6.1, 6.3_

  - [ ] 8.2 实现窗户检测
    - 平行线检测
    - 窗户位置记录
    - _Requirements: 6.2, 6.4_

- [ ] 9. 比例计算
  - [ ] 9.1 实现自动比例检测
    - 比例尺符号检测
    - 数字识别
    - _Requirements: 7.1_

  - [ ] 9.2 实现手动比例输入
    - 用户输入参考尺寸
    - 像素到米转换
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 10. Checkpoint - 完整识别流程验证
  - 端到端识别测试
  - 多种户型图测试
  - 识别准确率评估

## Phase 4: 用户界面与集成 (Week 4)

- [ ] 11. 校正编辑界面
  - [ ] 11.1 实现 RecognitionEditCanvas
    - 原图叠加显示
    - 房间边界可视化
    - 置信度颜色标识
    - _Requirements: 9.1_

  - [ ] 11.2 实现房间编辑功能
    - 拖拽调整边界
    - 房间重命名
    - 类型修改
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ] 11.3 实现房间增删
    - 手动添加房间
    - 删除错误房间
    - _Requirements: 9.5_

- [ ] 12. 数据生成与导出
  - [ ] 12.1 实现 homeData 生成器
    - 坐标转换
    - 数据格式化
    - 颜色分配
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 12.2 实现导出功能
    - JSON 下载
    - 应用到当前会话
    - _Requirements: 10.2, 10.3_

- [ ] 13. 3D 预览集成
  - [ ] 13.1 实现预览组件
    - 复用现有 FloorPlan
    - 实时预览更新
    - _Requirements: 10.1_

  - [ ] 13.2 实现重新生成
    - 参数调整
    - 重新识别
    - _Requirements: 10.4_

- [ ] 14. Final Checkpoint - 完整功能测试
  - 完整用户流程测试
  - 边界情况处理
  - 性能优化

## 技术栈总结

### 后端
- Python 3.10+
- FastAPI
- OpenCV (opencv-python)
- Tesseract OCR (pytesseract)
- NumPy

### 前端
- React + TypeScript
- Zustand (状态管理)
- Canvas API (编辑界面)
- 现有 Three.js 渲染组件

### 部署
- 后端: Docker + 云服务 (AWS Lambda / Vercel Serverless)
- 前端: 现有 Vercel 部署

## 风险与备选方案

| 风险 | 影响 | 备选方案 |
|------|------|----------|
| OpenCV 识别精度不足 | 高 | 接入 GPT-4 Vision API |
| Tesseract 中文识别差 | 中 | 使用百度/腾讯 OCR API |
| 复杂户型无法处理 | 中 | 提供纯手动绘制模式 |
| 后端部署成本 | 低 | 使用 Serverless 按需计费 |

## 简化版方案（MVP）

如果时间有限，可以先实现简化版：

1. **仅支持简单矩形户型**
2. **手动输入房间名称**（跳过 OCR）
3. **手动输入比例**（跳过自动检测）
4. **基础墙体检测 + 手动校正**

MVP 预计工时：1-2 周

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
