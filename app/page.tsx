'use client';

import { useState, useEffect, useCallback } from 'react';

interface Sensors {
  pressure: number;
  soilTemp: number;
  soilHumidity: number;
  waterLevel: number;
  airTemp: number;
  airHumidity: number;
}

interface Pumps {
  irrigation: boolean;
  suction: boolean;
}

export default function IrrigationControl() {
  const [sensors, setSensors] = useState<Sensors>({
    pressure: 800,
    soilTemp: 35,
    soilHumidity: 75,
    waterLevel: 15,
    airTemp: 35,
    airHumidity: 75
  });

  const [pumps, setPumps] = useState<Pumps>({
    irrigation: true,
    suction: false
  });

  const [showPopup, setShowPopup] = useState(false);
  const [, setLogs] = useState<string[]>(['System initialized']);
  const [, setLoading] = useState(false);

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
    console.log(`[${timestamp}]`, message);
  }, []);

  // Fetch sensor data
  const fetchSensorData = useCallback(async () => {
    setLoading(true);
    addLog('Fetching sensor data...');
    
    try {
      const response = await fetch('http://localhost:8080/api/sensors');
      const data = await response.json();
      setSensors(data);
      addLog('Sensor data updated');
    } catch (error) {
      addLog(`Error fetching sensors: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Simulate data for testing
      setSensors({
        pressure: Math.floor(700 + Math.random() * 200),
        soilTemp: Math.floor(30 + Math.random() * 10),
        soilHumidity: Math.floor(60 + Math.random() * 30),
        waterLevel: Math.floor(10 + Math.random() * 20),
        airTemp: Math.floor(30 + Math.random() * 10),
        airHumidity: Math.floor(60 + Math.random() * 30)
      });
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  // Control pump
  const controlPump = async (type: string) => {
    addLog(`Control pump: ${type}`);
    
    try {
      const response = await fetch('http://localhost:8080/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: type,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPumps(prev => ({
          ...prev,
          [type === 'pompa' ? 'irrigation' : 'suction']: !prev[type === 'pompa' ? 'irrigation' : 'suction']
        }));
        addLog(`${type} pump toggled successfully`);
      }
    } catch (error) {
      addLog(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Simulate for testing
      setPumps(prev => ({
        ...prev,
        [type === 'pompa' ? 'irrigation' : 'suction']: !prev[type === 'pompa' ? 'irrigation' : 'suction']
      }));
    }
    
    setShowPopup(false);
  };

  // Test API connection
  const testAPI = async () => {
    addLog('Testing API connection...');
    
    try {
      const response = await fetch('http://localhost:8080/api/test');
      const data = await response.json();
      addLog(`API Test: ${data.message || 'Connection OK'}`);
    } catch (error) {
      addLog(`API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auto-refresh option
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSensorData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-2 md:p-4 lg:p-6">
      <div className="p-3 md:p-6 w-full max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-1 md:col-span-3 md:mb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full relative shadow-lg shadow-yellow-400/50">
              <div className="absolute inset-[-8px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full animate-spin opacity-50"></div>
            </div>
            <span className="text-sm font-medium text-gray-800">3/3 Connected</span>
          </div>
          <span className="text-lg">📶</span>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6 md:col-span-2">
          {/* Pressure Sensor */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span>🎯</span> Tekanan
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.pressure}</div>
          </div>

          {/* Soil Sensor */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2">Tanah</div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.soilTemp}°C</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-gray-600">💧 {sensors.soilHumidity}%</span>
            </div>
          </div>

          {/* Water Level Sensor - Highlighted */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span>💧</span> Ketinggian Air
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.waterLevel}cm</div>
          </div>

          {/* Air Sensor */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2">Udara</div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.airTemp}°C</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-gray-600">💧 {sensors.airHumidity}%</span>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="p-4 mb-4 md:mb-0 md:col-span-1">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-800">Status Pompa Irigasi</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase border ${
              pumps.irrigation ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
            }`}>
              {pumps.irrigation ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-800">Status Pompa Sedot</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase border ${
              pumps.suction ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'
            }`}>
              {pumps.suction ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <div className="text-sm font-medium text-gray-800">Pompa selanjutnya: Hari ini,</div>
              <div className="text-xs text-gray-600 mt-1">18:00</div>
            </div>
            <button 
              className="bg-gray-900 text-white px-7 py-3.5 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              onClick={() => setShowPopup(true)}
            >
              Kontrol Manual
            </button>
          </div>
        </div>

        {/* Weather Alert */}
        <div className="p-3 mb-4 md:col-span-3">
          <span className="text-lg">☀️</span>
          <div className="flex-1 text-sm leading-relaxed text-gray-800 mt-1">
            <strong>Perkiraan Cuaca</strong><br />
            Cerah selama beberapa jam ke depan. Jadwal pengairan telah disesuaikan
          </div>
        </div>

        {/* Bottom Navigation (mobile only) */}
        <div className="flex justify-around mt-4 pt-4 border-t border-gray-200 md:col-span-3 md:hidden">
          <div className="flex flex-col items-center gap-1.5 cursor-pointer transition-opacity duration-200 hover:opacity-70">
            <span className="text-xl text-gray-600">📅</span>
            <span className="text-[11px] text-gray-600">Jadwal</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 cursor-pointer transition-opacity duration-200 hover:opacity-70">
            <span className="text-xl text-gray-600">📊</span>
            <span className="text-[11px] text-gray-600">History</span>
          </div>
        </div>
        
        {/* Desktop inline panels for Jadwal and History */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 md:col-span-3 mt-2">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-2">Jadwal</div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• 08:00 - Irigasi 15 menit</li>
              <li>• 12:00 - Irigasi 10 menit</li>
              <li>• 18:00 - Irigasi 20 menit</li>
            </ul>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-2">History</div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• 07:55 - Sensor update sukses</li>
              <li>• 07:40 - Pompa irigasi ON</li>
              <li>• 07:25 - Pompa irigasi OFF</li>
            </ul>
          </div>
        </div>
        </div>

        {/* Popup Modal */}
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300" onClick={() => setShowPopup(false)}>
            <div className="bg-white rounded-3xl p-8 w-[90%] max-w-sm animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-5 mb-6">
                <div 
                  className="flex-1 flex flex-col items-center p-6 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-orange-400 to-orange-600"
                  onClick={() => controlPump('sedot')}
                >
                  <div className="text-4xl text-white mb-2.5">↓</div>
                  <div className="text-base font-semibold text-white">Sedot</div>
                </div>
                <div 
                  className="flex-1 flex flex-col items-center p-6 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-blue-400 to-blue-600"
                  onClick={() => controlPump('pompa')}
                >
                  <div className="text-4xl text-white mb-2.5">💧</div>
                  <div className="text-base font-semibold text-white">Pompa</div>
                </div>
              </div>
              <button 
                className="w-full py-3.5 bg-gray-900 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-700"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        <div className="fixed bottom-2.5 right-2.5 z-50">
          <button 
            onClick={testAPI}
            className="bg-gray-900 text-white border-none px-3 py-2 rounded-md text-xs cursor-pointer"
          >
            Test API
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================
// app/styles.css
/* 

*/

// ===================================
// app/api/sensors/route.js
/*

*/

// ===================================
// app/api/control/route.js
/*

*/

// ===================================
// app/api/test/route.js
/*

*/

