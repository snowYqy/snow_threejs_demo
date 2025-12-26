import { useHomeStore } from '../store/useHomeStore';

const DEVICE_NAMES: Record<string, string> = {
  light: '💡 灯',
  ac: '❄️ 空调',
  fan: '🌀 风扇',
  curtain: '🪟 窗帘',
  tv: '📺 电视',
  speaker: '🔊 音箱',
  humidifier: '💧 加湿器',
  purifier: '🌿 净化器',
  heater: '🔥 取暖器',
};

/**
 * UI组件 - 智能家居控制面板
 */
const UI: React.FC = () => {
  const selectedRoom = useHomeStore((state) => state.selectedRoom);
  const roomNames = useHomeStore((state) => state.roomNames);
  const homeData = useHomeStore((state) => state.homeData);
  const toggleDevice = useHomeStore((state) => state.toggleDevice);
  const toggleAllDevicesInRoom = useHomeStore((state) => state.toggleAllDevicesInRoom);

  // 获取选中房间的设备
  const selectedRoomData = homeData?.rooms.find(r => r.id === selectedRoom);
  const devices = selectedRoomData?.devices ?? [];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-sans">
      {/* 标题 */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center">
        <h1 className="m-0 px-6 py-3 text-2xl font-semibold text-gray-800 bg-white/90 rounded-lg shadow-md">
          🏠 智能家居控制
        </h1>
      </div>

      {/* 操作说明 */}
      <div className="absolute top-5 left-5 p-4 bg-white/90 rounded-lg shadow-md max-w-[200px]">
        <h3 className="m-0 mb-3 text-sm font-semibold text-gray-800">操作说明</h3>
        <ul className="m-0 p-0 list-none space-y-1.5 text-xs text-gray-600">
          <li>🖱️ 左键拖拽 - 旋转</li>
          <li>🖱️ 右键拖拽 - 平移</li>
          <li>🖱️ 滚轮 - 缩放</li>
          <li>🖱️ 点击房间 - 选中</li>
          <li>🖱️ 点击设备 - 开关</li>
        </ul>
      </div>

      {/* 设备控制面板 */}
      <div className="absolute top-5 right-5 p-4 bg-white/95 rounded-lg shadow-lg min-w-[220px] max-h-[80vh] overflow-y-auto pointer-events-auto">
        <h3 className="m-0 mb-3 text-base font-semibold text-gray-800">
          {selectedRoom ? `📍 ${roomNames[selectedRoom]}` : '📍 选择房间'}
        </h3>
        
        {selectedRoom && devices.length > 0 ? (
          <>
            {/* 全部开关 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => toggleAllDevicesInRoom(selectedRoom, true)}
                className="flex-1 px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                全部开启
              </button>
              <button
                onClick={() => toggleAllDevicesInRoom(selectedRoom, false)}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                全部关闭
              </button>
            </div>
            
            {/* 设备列表 */}
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{DEVICE_NAMES[device.type] || device.type}</span>
                    <span className="text-xs text-gray-500">{device.name}</span>
                  </div>
                  <button
                    onClick={() => toggleDevice(selectedRoom, device.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      device.isOn ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        device.isOn ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : selectedRoom ? (
          <p className="text-sm text-gray-500">该房间暂无智能设备</p>
        ) : (
          <p className="text-sm text-gray-500">点击房间查看设备</p>
        )}
      </div>
    </div>
  );
};

export default UI;
