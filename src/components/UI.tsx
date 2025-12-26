import { useHomeStore } from '../store/useHomeStore';

/**
 * UI组件 - 使用Tailwind CSS
 */
const UI: React.FC = () => {
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const roomNames = useHomeStore((state) => state.roomNames);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-sans">
      {/* 标题 */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center">
        <h1 className="m-0 px-6 py-3 text-2xl font-semibold text-gray-800 bg-white/90 rounded-lg shadow-md">
          3D智能家居
        </h1>
      </div>

      {/* 操作说明 */}
      <div className="absolute top-5 left-5 p-4 bg-white/90 rounded-lg shadow-md max-w-[220px]">
        <h3 className="m-0 mb-3 text-base font-semibold text-gray-800">操作说明</h3>
        <ul className="m-0 p-0 list-none space-y-2">
          <li className="text-sm text-gray-600">🖱️ 左键拖拽 - 旋转视角</li>
          <li className="text-sm text-gray-600">🖱️ 右键拖拽 - 平移视角</li>
          <li className="text-sm text-gray-600">🖱️ 滚轮 - 缩放视角</li>
          <li className="text-sm text-gray-600">🖱️ 点击房间 - 选中/取消</li>
        </ul>
      </div>

      {/* 选中房间信息 */}
      <div className="absolute top-5 right-5 p-4 bg-white/90 rounded-lg shadow-md min-w-[120px] text-center">
        <h3 className="m-0 mb-2 text-base font-semibold text-gray-800">当前选中</h3>
        <p className="m-0 text-lg font-medium text-blue-500">
          {selectedRoom ? roomNames[selectedRoom] || '未知房间' : '无'}
        </p>
      </div>
    </div>
  );
};

export default UI;
