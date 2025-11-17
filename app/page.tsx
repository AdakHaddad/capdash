'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import ShallotAvatar from './components/ShallotAvatar';
import ScheduleCalendar from './components/ScheduleCalendar';
import SensorHistory from './components/SensorHistory';

interface Sensors {
  pressure: number;
  soilTemp: number;
  soilHumidity: number;
  waterLevel: number;
  airTemp: number;
  airHumidity: number;
  ds_t?: number[];
  soil?: number[];
  water?: number[];
}

interface Pumps {
  irrigation: boolean;
  suction: boolean;
}

interface Valves {
  valve1: boolean;
  valve2: boolean;
  valve3: boolean;
}

interface Inference {
  irrigation_recommendation: number;
  water_stress_level: number;
  should_irrigate: boolean;
  decision_reason: string;
  timestamp: number;
}

interface ApiResponse {
  pressure: number;
  soilTemp: number;
  soilHumidity: number;
  waterLevel: number;
  airTemp: number;
  airHumidity: number;
  timestamp: number;
  inference?: Inference;
  pumps?: {
    irrigation: boolean;
    suction: boolean;
    timestamp: number;
  };
  data_source?: string;
  mqtt_connected?: boolean;
}

export default function IrrigationControl() {
  // "Happy" fallback defaults used when no realtime data is available
  const [sensors, setSensors] = useState<Sensors>({
    // Typical comfortable environmental values for a healthy plant
    pressure: 825,
    soilTemp: 25,
    soilHumidity: 70,
    waterLevel: 10,
    airTemp: 27,
    airHumidity: 65
  });

  // Default pumps state for safe/fallback behaviour: irrigation OFF
  const [pumps, setPumps] = useState<Pumps>({
    irrigation: false,
    suction: false
  });

  const [valves, setValves] = useState<Valves>({ valve1: false, valve2: false, valve3: false });

  const [inference, setInference] = useState<Inference | null>(null);
  const [dataSource, setDataSource] = useState<string>('unknown');
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [mqttStatus, setMqttStatus] = useState<string>('disconnected');
  const [showPopup, setShowPopup] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [, setLogs] = useState<string[]>(['System initialized']);
  const [, setLoading] = useState(false);
  const [nextSchedule, setNextSchedule] = useState<{ time: string; name: string; duration: number } | null>(null);
  // Remove unused lastDataReceived to fix lint warning
  // const [lastDataReceived, setLastDataReceived] = useState<Date | null>(null);

  // MQTT client reference (persist across renders)
  const mqttClientRef = useRef<MqttClient | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());

  // API base URL - can be switched between backends
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
    console.log(`[${timestamp}]`, message);
  }, []);

  // Fetch next schedule
  const fetchNextSchedule = useCallback(async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // First, get daily recurring schedules that haven't passed today
      const { data: dailySchedules, error: dailyError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_type', 'daily')
        .gte('time_of_day', currentTime)
        .order('time_of_day', { ascending: true });

      if (dailyError) {
        console.error('Error fetching daily schedules:', dailyError);
      }

      // Second, get one-time schedules for today that haven't passed yet
      const { data: oneTimeSchedules, error: oneTimeError } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_type', 'one-time')
        .eq('specific_date', today)
        .gte('time_of_day', currentTime)
        .order('time_of_day', { ascending: true });

      if (oneTimeError) {
        console.error('Error fetching one-time schedules:', oneTimeError);
      }

      // Combine and sort both types of schedules
      const allSchedules = [
        ...(dailySchedules || []),
        ...(oneTimeSchedules || [])
      ].sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));

      if (allSchedules.length > 0) {
        const schedule = allSchedules[0];
        setNextSchedule({
          time: schedule.time_of_day,
          name: schedule.name,
          duration: Math.floor(schedule.duration_seconds / 60) // Convert to minutes
        });
      } else {
        setNextSchedule(null);
      }
    } catch (error) {
      console.error('Error fetching next schedule:', error);
    }
  }, []);

  // Fetch sensor data
  const fetchSensorData = useCallback(async () => {
    setLoading(true);
    addLog('Fetching sensor data...');
    
    try {
      const response = await fetch(`${API_BASE}/api/sensors`);
      const data: ApiResponse = await response.json();
      
      // Update sensors
      setSensors({
        pressure: data.pressure,
        soilTemp: data.soilTemp,
        soilHumidity: data.soilHumidity,
        waterLevel: data.waterLevel,
        airTemp: data.airTemp,
        airHumidity: data.airHumidity
      });

      // Update inference if available
      if (data.inference) {
        setInference(data.inference);
      }

      // Update pump status if available
      if (data.pumps) {
        setPumps({
          irrigation: data.pumps.irrigation,
          suction: data.pumps.suction
        });
      }

      // Update connection status
      setDataSource(data.data_source || 'unknown');
      setMqttConnected(data.mqtt_connected || false);

      addLog(`Sensor data updated (${data.data_source || 'unknown'})`);
      if (data.inference?.should_irrigate) {
        addLog(`AI Recommendation: ${data.inference.decision_reason}`);
      }
    } catch (error) {
      addLog(`Error fetching sensors: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't simulate random data - just rely on MQTT from test.mosquitto.org
      addLog('Waiting for MQTT data from test.mosquitto.org...');
      setDataSource('awaiting-mqtt');
    } finally {
      setLoading(false);
    }
  }, [addLog, API_BASE]);

  // Initialize MQTT (WS) connection to test.mosquitto.org
  useEffect(() => {
    // Auto-detect secure/insecure WebSocket based on page protocol
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const defaultBroker = isSecure 
      ? 'wss://test.mosquitto.org:8081'  // Secure WebSocket for HTTPS
      : 'ws://test.mosquitto.org:8080';   // Regular WebSocket for HTTP
    
    const MQTT_WS_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || defaultBroker;
    const TOPIC_TELEMETRY = process.env.NEXT_PUBLIC_MQTT_TOPIC || 'd02/telemetry';

    console.log(`🌐 Page Protocol: ${window.location.protocol}`);
    console.log(`🔌 MQTT Broker: ${MQTT_WS_URL}`);
    addLog(`🔌 Connecting to MQTT: ${MQTT_WS_URL}`);
    
    if (isSecure && MQTT_WS_URL.startsWith('ws://')) {
      console.error('⚠️ WARNING: Using insecure WebSocket (ws://) on HTTPS page - this will be blocked by browser!');
      addLog('⚠️ WARNING: Insecure WebSocket blocked by browser security');
    }

    // Updated client configuration for test.mosquitto.org
    const clientOptions: mqtt.IClientOptions = {
      clientId: 'NextJS_WebClient_' + Math.random().toString(16).substring(2, 8),
      reconnectPeriod: 2000,
      clean: true,
      connectTimeout: 10000,
      keepalive: 60,
      protocolVersion: 4, // MQTT 3.1.1
    };

    // Add authentication if credentials provided
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD;
    if (username) {
      clientOptions.username = username;
      console.log('🔐 Using MQTT authentication');
    }
    if (password) {
      clientOptions.password = password;
    }

    const client = mqtt.connect(MQTT_WS_URL, clientOptions);

    mqttClientRef.current = client;

    client.on('connect', (connack) => {
      setMqttConnected(true);
      setMqttStatus('connected');
      lastHeartbeatRef.current = Date.now();
      console.log('✅ MQTT Connected:', connack);
      addLog('✅ MQTT connected to test.mosquitto.org');
      addLog(`Connection info: ${JSON.stringify(connack)}`);
      
      try {
        // Subscribe to all relevant topics
        const topics = [
          TOPIC_TELEMETRY,
          'd02/status',
          'd02/cmd',
          'test'
        ];
        
        topics.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err, granted) => {
            if (err) {
              console.error(`❌ Subscribe failed for ${topic}:`, err);
              addLog(`❌ Subscribe failed for ${topic}: ${err.message}`);
            } else {
              console.log(`✅ Subscribed to ${topic} (QoS: ${granted?.[0]?.qos || 0})`);
              addLog(`✅ Subscribed to ${topic} (QoS: ${granted?.[0]?.qos || 0})`);
            }
          });
        });
        
      } catch (e) {
        console.error('❌ Subscribe error:', e);
        addLog(`❌ Subscribe error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    });

    client.on('reconnect', () => {
      setMqttStatus('reconnecting');
      console.log('🔄 MQTT reconnecting...');
      addLog('🔄 MQTT reconnecting...');
    });

    client.on('close', () => {
      setMqttConnected(false);
      setMqttStatus('disconnected');
      console.log('🔌 MQTT connection closed');
      addLog('🔌 MQTT connection closed');
    });

    client.on('error', (err) => {
      setMqttConnected(false);
      setMqttStatus('error');
      console.error('❌ MQTT Error:', err);
      addLog(`❌ MQTT error: ${err?.message || String(err)}`);
      console.error('MQTT Error Details:', err);
    });

    client.on('offline', () => {
      setMqttConnected(false);
      addLog('📵 MQTT client offline');
    });

    client.on('disconnect', (packet) => {
      setMqttConnected(false);
      addLog(`🔌 MQTT disconnected: ${JSON.stringify(packet)}`);
    });

    client.on('message', (topic, payload) => {
      const payloadStr = payload.toString();
      console.log(`📬 MQTT Message Received:`, {
        topic,
        payload: payloadStr.substring(0, 100),
        length: payloadStr.length,
        timestamp: new Date().toISOString()
      });
      
      if (topic === TOPIC_TELEMETRY || topic === 'd02/status' || topic === 'd02/telemetry' || topic === 'test') {  // Support all topics
        try {
          addLog(`📨 Received on ${topic}: ${payloadStr.substring(0, 80)}...`);
          
          // Handle pump status updates
          if (topic === 'd02/status') {
            if (payloadStr.includes('pump_irrigation=')) {
              const irrigationState = payloadStr.match(/pump_irrigation=(\w+)/)?.[1];
              if (irrigationState) {
                setPumps(prev => ({
                  ...prev,
                  irrigation: irrigationState === 'ON'
                }));
                addLog(`🚰 Irrigation pump: ${irrigationState}`);
              }
            }
            if (payloadStr.includes('pump_suction=')) {
              const suctionState = payloadStr.match(/pump_suction=(\w+)/)?.[1];
              if (suctionState) {
                setPumps(prev => ({
                  ...prev,
                  suction: suctionState === 'ON'
                }));
                addLog(`🔄 Suction pump: ${suctionState}`);
              }
            }
            return; // Don't process further for pump status
          }
          
          // If it's just a simple test message (like "STM32_OK" or "Hello")
          if (topic === 'test') {
            addLog(`🔔 Test message received: ${payloadStr}`);
            // Only set to test mode if we don't already have real data
            if (dataSource === 'unknown' || dataSource === 'awaiting-mqtt') {
              setDataSource('mqtt-test');
            }
            // Don't update sensors for test messages, just show they arrived
            return;
          }
          
          // Check if it's JSON format
          if (payloadStr.startsWith('{')) {
            const data = JSON.parse(payloadStr);
            
            // Check for STM32 format: {"ts":175938,"mode":"AUTO","bme":{...},"ds18b20":[...],"soil":[...],"water":[...],"valve":[...],"pump":[...]}
            if (typeof data === 'object' && data.bme && data.bme.t !== undefined) {
              const soilTemps = data.ds18b20 || [];
              const soilMoisture = data.soil || [];
              const waterLevels = data.water || [];
              const valves = data.valve || [0, 0, 0];
              const pumps = data.pump || [0, 0];

              // Filter out invalid DS18B20 readings (-127 means sensor error)
              const validSoilTemps = soilTemps.filter((temp: number) => temp > -100);
              const avgSoilTemp = validSoilTemps.length > 0 
                ? validSoilTemps.reduce((a: number, b: number) => a + b, 0) / validSoilTemps.length 
                : data.bme.t; // Fallback to air temp if no valid soil temp

              setSensors({
                pressure: data.bme.p,
                airTemp: data.bme.t,
                airHumidity: data.bme.h,
                soilTemp: avgSoilTemp,
                soilHumidity: soilMoisture.length > 0 ? soilMoisture.reduce((a: number, b: number) => a + b, 0) / soilMoisture.length : 0,
                waterLevel: waterLevels.length > 0 ? waterLevels.reduce((a: number, b: number) => a + b, 0) / waterLevels.length : 0,
                ds_t: soilTemps,
                soil: soilMoisture,
                water: waterLevels,
              });

              setPumps({
                irrigation: pumps[0] === 1,
                suction: pumps[1] === 1,
              });

              setValves({
                valve1: valves[0] === 1,
                valve2: valves[1] === 1,
                valve3: valves[2] === 1,
              });

              setDataSource('stm32-json');
              addLog(`✅ STM32 JSON: ${data.bme.t.toFixed(1)}°C ${data.bme.p}hPa | Mode:${data.mode} | Pumps:[${pumps[0]},${pumps[1]}]`);
            }
            // Legacy flat JSON format support
            else if (typeof data === 'object' && data.bme_t) {
              const soilTemps = data.ds_t || [];
              const soilMoisture = [data.soil0, data.soil1, data.soil2];
              const waterLevels = [data.water1, data.water2];

              setSensors({
                pressure: data.bme_p,
                airTemp: data.bme_t,
                airHumidity: data.bme_h,
                soilTemp: soilTemps.length > 0 ? soilTemps.reduce((a: number, b: number) => a + b, 0) / soilTemps.length : 0,
                soilHumidity: soilMoisture.reduce((a: number, b: number) => a + b, 0) / soilMoisture.length,
                waterLevel: waterLevels.reduce((a: number, b: number) => a + b, 0) / waterLevels.length,
                ds_t: soilTemps,
                soil: soilMoisture,
                water: waterLevels,
              });

              setPumps({
                irrigation: data.pump1,
                suction: data.pump2,
              });

              setValves({
                valve1: data.valve1,
                valve2: data.valve2,
                valve3: data.valve3,
              });

              setDataSource('mqtt-json-legacy');
              addLog(`✅ Legacy JSON data updated`);
            } else if (typeof data === 'object' && typeof data.pressure === 'number' && typeof data.soilTemp === 'number') { // Keep old JSON format support
                setSensors(prev => ({
                  pressure: data.pressure ?? prev.pressure,
                  soilTemp: data.soilTemp ?? prev.soilTemp,
                  soilHumidity: data.soilHumidity ?? prev.soilHumidity,
                  waterLevel: data.waterLevel ?? prev.waterLevel,
                  airTemp: data.airTemp ?? prev.airTemp,
                  airHumidity: data.airHumidity ?? prev.airHumidity,
                }));
                setDataSource('mqtt-json-simple');
                addLog(`✅ Simple JSON data updated`);
            }
          }
          // Check if it's simple STM32 format: "STM32_DATA_P701_ST21_SH52_WL12_AT26_AH62_C1"
          else if (payloadStr.includes('STM32_DATA_') || payloadStr.includes('P') && payloadStr.includes('_')) {
            const cleanData = payloadStr.replace('STM32_DATA_', '');
            
            // Parse simple format: P701_ST21_SH52_WL12_AT26_AH62_C1
            const pressure = cleanData.match(/P(\d+)/)?.[1];
            const soilTemp = cleanData.match(/ST(\d+)/)?.[1];
            const soilHumidity = cleanData.match(/SH(\d+)/)?.[1];
            const waterLevel = cleanData.match(/WL(\d+)/)?.[1];
            const airTemp = cleanData.match(/AT(\d+)/)?.[1];
            const airHumidity = cleanData.match(/AH(\d+)/)?.[1];
            const counter = cleanData.match(/C(\d+)/)?.[1];
            
            if (pressure && soilTemp) {
              setSensors(prev => ({
                pressure: parseInt(pressure) || prev.pressure,
                soilTemp: parseInt(soilTemp) || prev.soilTemp,
                soilHumidity: parseInt(soilHumidity || '0') || prev.soilHumidity,
                waterLevel: parseInt(waterLevel || '0') || prev.waterLevel,
                airTemp: parseInt(airTemp || '0') || prev.airTemp,
                airHumidity: parseInt(airHumidity || '0') || prev.airHumidity,
              }));
              setDataSource('stm32-simple');
              addLog(`✅ STM32 simple data updated (reading #${counter || '0'})`);
            }
          }
          // Check if it's ultra-short STM32 format: "P701T21H52W12A26H62"
          else if (payloadStr.match(/^P\d+T\d+H\d+W\d+A\d+H\d+$/)) {
            // Parse ultra-short format: P701T21H52W12A26H62
            const pressure = payloadStr.match(/P(\d+)/)?.[1];
            const soilTemp = payloadStr.match(/T(\d+)/)?.[1];
            const soilHumidity = payloadStr.match(/H(\d+)/)?.[1];
            const waterLevel = payloadStr.match(/W(\d+)/)?.[1];
            const airTemp = payloadStr.match(/A(\d+)/)?.[1];
            const airHumidity = payloadStr.match(/H(\d+)$/)?.[1];  // Last H for air humidity
            
            if (pressure && soilTemp) {
              setSensors(prev => ({
                pressure: parseInt(pressure) || prev.pressure,
                soilTemp: parseInt(soilTemp) || prev.soilTemp,
                soilHumidity: parseInt(soilHumidity || '0') || prev.soilHumidity,
                waterLevel: parseInt(waterLevel || '0') || prev.waterLevel,
                airTemp: parseInt(airTemp || '0') || prev.airTemp,
                airHumidity: parseInt(airHumidity || '0') || prev.airHumidity,
              }));
              setDataSource('stm32-ultra');
              addLog(`✅ STM32 ultra-short data updated: P${pressure} T${soilTemp} W${waterLevel || '0'}`);
            }
          }
          // Check if it's new STM32 BME format: "BME: 25.1C, 1013hPa, 65% | Soil: 60%, 58%, 62% | Water: 35.5%, 40.2% | Pompa: ON, OFF | V1: ON | V2: OFF | V3: ON"
          else if (payloadStr.includes('BME:') && payloadStr.includes('Soil:') && payloadStr.includes('Water:')) {
            // Parse BME280 comprehensive format
            const bmeMatch = payloadStr.match(/BME:\s*([\d.]+)C,\s*([\d.]+)hPa,\s*([\d.]+)%/);
            const soilMatch = payloadStr.match(/Soil:\s*(\d+)%,\s*(\d+)%,\s*(\d+)%/);
            const waterMatch = payloadStr.match(/Water:\s*([\d.]+)%,\s*([\d.]+)%/);
            const pompaMatch = payloadStr.match(/Pompa:\s*(\w+),\s*(\w+)/);
            
            if (bmeMatch) {
              const airTemp = parseFloat(bmeMatch[1]);
              const pressure = parseFloat(bmeMatch[2]);
              const airHumidity = parseFloat(bmeMatch[3]);
              
              // Average soil moisture from 3 sensors
              let avgSoilHumidity = 0;
              if (soilMatch) {
                const soil1 = parseInt(soilMatch[1]);
                const soil2 = parseInt(soilMatch[2]);
                const soil3 = parseInt(soilMatch[3]);
                avgSoilHumidity = Math.round((soil1 + soil2 + soil3) / 3);
              }
              
              // Average water level from 2 sensors
              let avgWaterLevel = 0;
              if (waterMatch) {
                const water1 = parseFloat(waterMatch[1]);
                const water2 = parseFloat(waterMatch[2]);
                avgWaterLevel = Math.round((water1 + water2) / 2);
              }
              
              setSensors(prev => ({
                pressure: pressure || prev.pressure,
                soilTemp: airTemp || prev.soilTemp, // Use air temp as approximation
                soilHumidity: avgSoilHumidity || prev.soilHumidity,
                waterLevel: avgWaterLevel || prev.waterLevel,
                airTemp: airTemp || prev.airTemp,
                airHumidity: airHumidity || prev.airHumidity,
              }));
              
              // Update pump status from Pompa field
              if (pompaMatch) {
                const pump1 = pompaMatch[1];
                const pump2 = pompaMatch[2];
                setPumps({
                  irrigation: pump1 === 'ON',
                  suction: pump2 === 'ON'
                });
              }
              
              setDataSource('stm32-bme280');
              addLog(`✅ STM32 BME280: ${airTemp.toFixed(1)}°C ${pressure}hPa ${airHumidity.toFixed(0)}% | Soil:${avgSoilHumidity}% Water:${avgWaterLevel}%${pompaMatch ? ` | Pumps:${pompaMatch[1]}/${pompaMatch[2]}` : ''}`);
            }
          }
          // Check if it's legacy STM32 comprehensive format: "st=25,at=27,sh=65,ah=55,p=825,wl=18,c=1"
          else if (payloadStr.includes('st=') && payloadStr.includes('at=') && payloadStr.includes('p=')) {
            // Parse comprehensive format: st=25,at=27,sh=65,ah=55,p=825,wl=18,c=1
            const soilTemp = payloadStr.match(/st=(\d+)/)?.[1];
            const airTemp = payloadStr.match(/at=(\d+)/)?.[1];
            const soilHum = payloadStr.match(/sh=(\d+)/)?.[1];
            const airHum = payloadStr.match(/ah=(\d+)/)?.[1];
            const pressure = payloadStr.match(/p=(\d+)/)?.[1];
            const waterLevel = payloadStr.match(/wl=(\d+)/)?.[1];
            const count = payloadStr.match(/c=(\d+)/)?.[1];
            
            if (soilTemp && airTemp && pressure) {
              setSensors(prev => ({
                pressure: parseInt(pressure) || prev.pressure,
                soilTemp: parseInt(soilTemp) || prev.soilTemp,
                soilHumidity: parseInt(soilHum || '0') || prev.soilHumidity,
                waterLevel: parseInt(waterLevel || '0') || prev.waterLevel,
                airTemp: parseInt(airTemp) || prev.airTemp,
                airHumidity: parseInt(airHum || '0') || prev.airHumidity,
              }));
              setDataSource('stm32-comprehensive');
              addLog(`✅ STM32 comprehensive data: ST${soilTemp}°C AT${airTemp}°C P${pressure} WL${waterLevel}cm (msg #${count || '?'})`);
            }
          }
          // Check if it's simple STM32 compact format: "temp=25.1,hum=60,count=1" (legacy support)
          else if (payloadStr.includes('temp=') && payloadStr.includes('hum=')) {
            // Parse compact format: temp=25.1,hum=60,count=1
            const temp = payloadStr.match(/temp=(\d+\.?\d*)/)?.[1];
            const hum = payloadStr.match(/hum=(\d+)/)?.[1];
            const count = payloadStr.match(/count=(\d+)/)?.[1];
            
            if (temp && hum) {
              setSensors(prev => ({
                pressure: prev.pressure, // Keep previous value
                soilTemp: Math.round(parseFloat(temp)) || prev.soilTemp,
                soilHumidity: parseInt(hum) || prev.soilHumidity,
                waterLevel: prev.waterLevel, // Keep previous value
                airTemp: Math.round(parseFloat(temp)) || prev.airTemp, // Use same temp for air
                airHumidity: parseInt(hum) || prev.airHumidity, // Use same humidity for air
              }));
              setDataSource('stm32-compact');
              addLog(`✅ STM32 compact data updated: T${temp}°C H${hum}% (msg #${count || '?'})`);
            }
          }
          // Check if it's STM32 status format: "status=online,uptime=145"
          else if (payloadStr.includes('status=') && payloadStr.includes('uptime=')) {
            const status = payloadStr.match(/status=(\w+)/)?.[1];
            const uptime = payloadStr.match(/uptime=(\d+)/)?.[1];
            
            if (status && uptime) {
              addLog(`📊 STM32 Status: ${status.toUpperCase()}, uptime: ${uptime}s`);
              // Only set to status if we don't have active telemetry data
              if (dataSource !== 'stm32-comprehensive' && dataSource !== 'stm32-compact') {
                setDataSource('stm32-status');
              }
            }
          }
          else {
            addLog(`⚠️ Unknown data format: ${payloadStr}`);
          }
          
          // Remove setLastDataReceived since we removed the state
        } catch (parseError) {
          addLog(`❌ Failed to parse data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          addLog(`Raw payload: ${payloadStr.substring(0, 100)}`);
          console.error('Parse error details:', parseError);
        }
      } else {
        // Log messages from other topics for debugging
        console.log(`📭 Message from unhandled topic: ${topic}`);
        addLog(`📭 Unhandled topic: ${topic} - ${payloadStr.substring(0, 50)}...`);
      }
    });

    return () => {
      try {
        client.end(true);
      } catch (closeError) {
        console.error('MQTT client shutdown failed:', closeError);
      }
      mqttClientRef.current = null;
    };
  }, [addLog, dataSource]);

  // Publish pump control over MQTT if connected
  const publishPumpControl = useCallback((type: string) => {
    const client = mqttClientRef.current;
    
    console.log('🔍 Publishing pump control...', {
      type,
      clientExists: !!client,
      connected: client?.connected,
      reconnecting: client?.reconnecting,
      timestamp: new Date().toISOString()
    });
    
    // Check if client exists and is actually connected
    if (!client) {
      console.warn('❌ MQTT client not initialized');
      addLog('❌ MQTT client not initialized');
      return false;
    }
    
    if (!client.connected) {
      console.warn('❌ MQTT client not connected. State:', client.reconnecting ? 'reconnecting' : 'disconnected');
      addLog(`❌ MQTT not connected (state: ${client.reconnecting ? 'reconnecting' : 'disconnected'})`);
      return false;
    }
    
    const topic = 'd02/cmd';
    // Simple format: just send "POMPA" or "SEDOT" as plain text
    const payload = type.toUpperCase(); // "POMPA" or "SEDOT"
    
    try {
      console.log(`📤 Attempting publish to ${topic}:`, payload);
      console.log(`📤 Client state:`, {
        connected: client.connected,
        disconnecting: client.disconnecting,
        disconnected: client.disconnected,
        reconnecting: client.reconnecting
      });
      
      client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
        if (err) {
          console.error('❌ MQTT publish error:', err);
          addLog(`❌ MQTT publish failed: ${err.message}`);
        } else {
          console.log('✅ MQTT publish successful to test.mosquitto.org');
          addLog(`✅ Published → d02/cmd: ${payload}`);
        }
      });
      return true;
    } catch (e) {
      console.error('❌ MQTT publish exception:', e);
      addLog(`❌ MQTT publish failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return false;
    }
  }, [addLog]);

  // Control pump
  const controlPump = async (type: string) => {
    console.log(`🎛️ Control pump requested: ${type}`);
    addLog(`🎛️ Control pump: ${type}`);
    
    // Check MQTT connection status first
    const client = mqttClientRef.current;
    console.log('MQTT Client State:', {
      exists: !!client,
      connected: client?.connected,
      reconnecting: client?.reconnecting
    });
    
    // Save command to database
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const pumpType = (type === 'pompa') ? 'irrigation' : 
                       (type === 'sedot') ? 'suction' : 
                       'unknown';
      
      const { error: dbError } = await supabase
        .from('pump_commands')
        .insert({
          command: type.toUpperCase(),
          pump_type: pumpType,
          duration_seconds: null,
          executed_at: new Date().toISOString(),
          source: 'manual'
        });

      if (dbError) {
        console.error('❌ Failed to save command to DB:', dbError);
        addLog(`⚠️ Command not saved to DB: ${dbError.message}`);
      } else {
        console.log('✅ Command saved to database');
        addLog('✅ Command logged to database');
      }
    } catch (dbSaveError) {
      console.error('DB save error:', dbSaveError);
    }
    
    // Prefer MQTT publish; if not connected, fall back to serverless API
    const sentViaMqtt = publishPumpControl(type);
    
    // Update pump states immediately for UI feedback
    if (type === 'pompa') {
      setPumps(prev => ({ ...prev, irrigation: true }));
    } else if (type === 'sedot') {
      setPumps(prev => ({ ...prev, suction: true }));
    } else if (type === 'stop') {
      // Turn off both pumps when STOP is sent
      setPumps({ irrigation: false, suction: false });
      addLog('🛑 All pumps stopped');
    }

    if (!sentViaMqtt) {
      console.log('⚠️ MQTT failed or not connected, using serverless API fallback...');
      addLog('⚠️ Using serverless API (MQTT unavailable)...');
      
      try {
        const response = await fetch('/api/pump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            command: type,
            duration_seconds: 300,
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API returned ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success) {
          setPumps(prev => ({
            ...prev,
            [type === 'pompa' ? 'irrigation' : 'suction']: true
          }));
          addLog(`✅ ${result.message}`);
        } else {
          addLog(`❌ Control failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('API Error:', error);
        addLog(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('✅ Command sent via MQTT');
    }
    
    setShowPopup(false);
  };

  // Test MQTT publish
  const testMQTTPublish = () => {
    const client = mqttClientRef.current;
    console.log('🧪 Testing MQTT publish...', {
      clientExists: !!client,
      connected: client?.connected,
      broker: process.env.NEXT_PUBLIC_MQTT_BROKER_URL
    });
    
    if (!client) {
      addLog('❌ MQTT client not initialized');
      return;
    }
    
    if (!client.connected) {
      addLog(`❌ MQTT not connected. Reconnecting: ${client.reconnecting}`);
      return;
    }
    
    const testPayload = `TEST_${Date.now()}`;
    client.publish('d02/cmd', testPayload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Test publish failed:', err);
        addLog(`❌ Test publish failed: ${err.message}`);
      } else {
        console.log('✅ Test publish successful');
        addLog(`✅ Test published to d02/cmd: ${testPayload}`);
      }
    });
  };

  // Test API connection
  const testAPI = async () => {
    addLog('Testing API connection...');
    
    try {
      const response = await fetch(`${API_BASE}/api/test`);
      const data = await response.json();
      addLog(`API Test: ${data.message || 'Connection OK'} (${data.server})`);
    } catch (error) {
      addLog(`API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch next schedule on mount and every minute
  useEffect(() => {
    fetchNextSchedule();
    const interval = setInterval(() => {
      fetchNextSchedule();
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [fetchNextSchedule]);

  // Auto-refresh option - only fetch from API if MQTT is not connected
  useEffect(() => {
    // Don't poll API if we have MQTT connection
    if (mqttConnected) {
      return;
    }
    
    const interval = setInterval(() => {
      fetchSensorData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchSensorData, mqttConnected]);

  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-2 md:p-4 lg:p-6">
      <div className="p-3 md:p-6 w-full max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-1 md:col-span-3 md:mb-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full relative shadow-lg ${
              mqttConnected 
                ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-400/50' 
                : mqttStatus === 'reconnecting'
                ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-400/50'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-400/50'
            }`}>
              <div className={`absolute inset-[-8px] rounded-full animate-spin opacity-50 ${
                mqttConnected 
                  ? 'bg-gradient-to-r from-transparent via-green-400 to-transparent'
                  : mqttStatus === 'reconnecting'
                  ? 'bg-gradient-to-r from-transparent via-blue-400 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-yellow-400 to-transparent'
              }`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {mqttConnected ? '🟢 MQTT Connected' : 
                 mqttStatus === 'reconnecting' ? '🔄 Reconnecting...' :
                 mqttStatus === 'error' ? '🔴 Connection Error' :
                 dataSource === 'fallback' ? 'Offline Mode' : 'Simulation Mode'}
              </span>
              <span className="text-xs text-gray-500">
                {mqttConnected ? 'test.mosquitto.org' : 
                 dataSource === 'stm32-comprehensive' ? '🌡️ STM32 Full Sensors' :
                 dataSource === 'stm32-json' ? '📊 STM32 JSON' :
                 dataSource === 'stm32-compact' ? '🚀 STM32 Live Data' : 
                 dataSource === 'stm32-status' ? '📊 STM32 Status' :
                 dataSource === 'mqtt-test' ? '🧪 MQTT Test' : 
                 dataSource === 'mqtt-json' ? '📊 JSON Data' :
                 dataSource === 'awaiting-mqtt' ? '⏳ Waiting...' : dataSource}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inference?.should_irrigate && (
              <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                AI: Irrigate
              </div>
            )}
            <span className="text-lg">📶</span>
          </div>
      </div>

        {/* Living Shallot Avatar - Embedded */}
        <div className="flex justify-center md:col-span-1 mb-4 md:mb-0">
          <div className="w-40 h-48 md:w-48 md:h-56">
            <ShallotAvatar
              airTemp={sensors.airTemp}
              airHumidity={sensors.airHumidity}
              soilHumidity={sensors.soilHumidity}
              soilTemp={sensors.soilTemp}
            />
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6 md:col-span-1">
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
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.soilTemp.toFixed(1)}°C</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-gray-600">💧 {sensors.soilHumidity.toFixed(1)}%</span>
            </div>
          </div>

          {/* Water Level Sensor - Highlighted */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span>💧</span> Ketinggian Air
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.waterLevel.toFixed(1)}cm</div>
          </div>

          {/* Air Sensor */}
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2">Udara</div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{sensors.airTemp.toFixed(1)}°C</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-gray-600">💧 {sensors.airHumidity.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Status Section - Compact */}
        <div className="md:col-span-1 mb-4 md:mb-0">
          {/* Pump Status Cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Irrigation Pump Card */}
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              pumps.irrigation 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-green-200 shadow-lg' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xl mb-1 transition-transform duration-300 ${pumps.irrigation ? 'animate-pulse' : ''}`}>💧</div>
              <div className="text-[10px] text-gray-600 mb-0.5">Irigasi</div>
              <div className={`text-base font-bold ${
                pumps.irrigation ? 'text-green-700' : 'text-gray-500'
              }`}>
                {pumps.irrigation ? 'ON' : 'OFF'}
              </div>
            </div>

            {/* Suction Pump Card */}
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
              pumps.suction 
                ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-blue-200 shadow-lg' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xl mb-1 transition-transform duration-300 ${pumps.suction ? 'animate-pulse' : ''}`}>🔄</div>
              <div className="text-[10px] text-gray-600 mb-0.5">Sedot</div>
              <div className={`text-base font-bold ${
                pumps.suction ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {pumps.suction ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>

          {/* Next Schedule Card */}
          <div className={`p-3 rounded-lg mb-3 border-2 transition-all duration-300 ${
            nextSchedule 
              ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{nextSchedule ? '⏰' : '📅'}</span>
              <div className="text-xs font-semibold text-gray-800">Jadwal Berikutnya</div>
            </div>
            {nextSchedule ? (
              <div className="text-base font-bold text-orange-700">
                {nextSchedule.time} - {nextSchedule.name} ({nextSchedule.duration} menit)
              </div>
            ) : (
              <div className="text-sm text-gray-500">Tidak ada jadwal hari ini</div>
            )}
          </div>

          {/* Control Button */}
          <button 
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-all duration-300 shadow-md hover:from-gray-700 hover:to-gray-800 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 flex items-center justify-center gap-2"
            onClick={() => setShowPopup(true)}
          >
            <span className="text-lg">🎮</span>
            Kontrol Manual
          </button>
        </div>

        {/* Weather Alert */}
        <div className="p-3 mb-4 md:col-span-3">
          <span className="text-lg">☀️</span>
          <div className="flex-1 text-sm leading-relaxed text-gray-800 mt-1">
            <strong>Perkiraan Cuaca</strong><br />
            Cerah selama beberapa jam ke depan. Jadwal pengairan telah disesuaikan
          </div>
        </div>

        {/* Detailed Sensor Grid */}
        <div className="md:col-span-3 mt-4">
          <h3 className="text-lg font-semibold mb-2">Detailed Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Valves</div>
              <div>Valve 1: {valves.valve1 ? 'ON' : 'OFF'}</div>
              <div>Valve 2: {valves.valve2 ? 'ON' : 'OFF'}</div>
              <div>Valve 3: {valves.valve3 ? 'ON' : 'OFF'}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Soil Temps</div>
              {sensors.ds_t?.map((temp, index) => (
                <div key={index}>Sensor {index}: {temp.toFixed(1)}°C</div>
              ))}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Soil Moisture</div>
              {sensors.soil?.map((hum, index) => (
                <div key={index}>Sensor {index}: {hum.toFixed(1)}%</div>
              ))}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Water Levels</div>
              {sensors.water?.map((level, index) => (
                <div key={index}>Sensor {index}: {level.toFixed(1)}%</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation (mobile only) */}
        <div className="flex justify-around mt-4 pt-4 border-t border-gray-200 md:col-span-3 md:hidden">
          <div 
            className="flex flex-col items-center gap-1.5 cursor-pointer transition-opacity duration-200 hover:opacity-70"
            onClick={() => setShowScheduleModal(true)}
          >
            <span className="text-xl text-gray-600">📅</span>
            <span className="text-[11px] text-gray-600">Jadwal</span>
          </div>
          <div 
            className="flex flex-col items-center gap-1.5 cursor-pointer transition-opacity duration-200 hover:opacity-70"
            onClick={() => setShowHistoryModal(true)}
          >
            <span className="text-xl text-gray-600">📊</span>
            <span className="text-[11px] text-gray-600">History</span>
        </div>
      </div>

        {/* Desktop inline panels for Jadwal and History */}
        <div className="hidden md:grid md:grid-cols-2 gap-4 md:col-span-3 mt-2">
          <div className="p-4 border border-gray-200 rounded-lg">
            <ScheduleCalendar />
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-4">📊 Sensor History</div>
            <SensorHistory />
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300" onClick={() => setShowPopup(false)}>
            <div className="bg-white rounded-3xl p-6 w-[90%] max-w-md animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">🎮 Kontrol Manual</h2>
              
              {/* Main Control Buttons - Row 1 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div 
                  className="flex flex-col items-center p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-blue-400 to-blue-600"
                  onClick={() => controlPump('pompa')}
                >
                  <div className="text-3xl text-white mb-2">💧</div>
                  <div className="text-sm font-semibold text-white">Pompa</div>
                  <div className="text-xs text-white/80 mt-1">Irigasi ON</div>
                </div>
                <div 
                  className="flex flex-col items-center p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-orange-400 to-orange-600"
                  onClick={() => controlPump('sedot')}
                >
                  <div className="text-3xl text-white mb-2">🔄</div>
                  <div className="text-sm font-semibold text-white">Sedot</div>
                  <div className="text-xs text-white/80 mt-1">Transfer Air</div>
                </div>
              </div>

              {/* Control Buttons - Row 2 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div 
                  className="flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-red-400 to-red-600"
                  onClick={() => controlPump('stop')}
                >
                  <div className="text-2xl text-white mb-1">🛑</div>
                  <div className="text-xs font-semibold text-white">Stop</div>
                </div>
                <div 
                  className="flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-green-400 to-green-600"
                  onClick={() => controlPump('auto')}
                >
                  <div className="text-2xl text-white mb-1">🤖</div>
                  <div className="text-xs font-semibold text-white">Auto</div>
                </div>
                <div 
                  className="flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-purple-400 to-purple-600"
                  onClick={() => controlPump('resume')}
                >
                  <div className="text-2xl text-white mb-1">▶️</div>
                  <div className="text-xs font-semibold text-white">Resume</div>
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

        {/* Schedule Modal (Mobile) */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300 md:hidden" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-white rounded-3xl p-6 w-[95%] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">📅 Jadwal Irigasi</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  onClick={() => setShowScheduleModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <ScheduleCalendar />
              </div>
            </div>
          </div>
        )}

        {/* History Modal (Mobile) */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300 md:hidden" onClick={() => setShowHistoryModal(false)}>
            <div className="bg-white rounded-3xl p-6 w-[95%] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">📊 Sensor History</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  onClick={() => setShowHistoryModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <SensorHistory />
              </div>
              <button 
                className="w-full mt-4 py-3 bg-gray-900 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-700"
                onClick={() => setShowHistoryModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        <div className="fixed bottom-2.5 right-2.5 z-50 flex flex-col gap-2">
          <button 
            onClick={testMQTTPublish}
            className="bg-blue-600 text-white border-none px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-blue-700"
          >
            Test MQTT Publish
          </button>
          <button 
            onClick={testAPI}
            className="bg-gray-900 text-white border-none px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-gray-700"
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

