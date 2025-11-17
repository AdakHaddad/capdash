'use client';

import { useEffect, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

interface TelemetryData {
  ts: number;
  bme_t: number;
  bme_p: number;
  bme_h: number;
  ds_t: number[];
  soil0: number;
  soil1: number;
  soil2: number;
  water1: number;
  water2: number;
  valve1: boolean;
  valve2: boolean;
  valve3: boolean;
  pump1: boolean;
  pump2: boolean;
  timestamp: string;
}

export default function MqttClientWidget() {
  const [messages, setMessages] = useState<string[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const topicTelemetry = 'd02/telemetry';
  const topicCommands = 'd02/commands';

  useEffect(() => {
    const url = 'wss://b2a051ac43c4410e86861ed01b937dec.s1.eu.hivemq.cloud:8884/mqtt';
    const clientId = 'web-' + Math.random().toString(16).slice(2);

    const client: MqttClient = mqtt.connect(url, {
      protocol: 'wss',
      username: 'user1',
      password: 'P@ssw0rd',
      clientId,
      clean: true,
      reconnectPeriod: 2000,
    });

    client.on('connect', () => {
      console.log('MQTT Connected');
      setConnectionStatus('Connected');
      client.subscribe(topicTelemetry, { qos: 1 });
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();
      console.log(`Received: ${topic} - ${message}`);
      
      // Add to messages list
      setMessages(prev => [`${new Date().toLocaleTimeString()}: ${topic}: ${message}`, ...prev].slice(0, 50));
      
      // Parse telemetry data if it's from the telemetry topic
      if (topic === topicTelemetry) {
        try {
          const data = JSON.parse(message);
          setTelemetryData({
            ...data,
            timestamp: new Date().toLocaleString()
          });
        } catch (error) {
          console.error('Failed to parse telemetry data:', error);
        }
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error', err);
      setConnectionStatus('Error: ' + err.message);
    });

    client.on('close', () => {
      setConnectionStatus('Disconnected');
    });

    client.on('reconnect', () => {
      setConnectionStatus('Reconnecting...');
    });

    return () => {
      try {
        client.end(true);
      } catch (closeError) {
        console.error('MQTT client shutdown failed:', closeError);
      }
    };
  }, [topicTelemetry]);

  const sendCommand = (cmd: unknown) => {
    const url = 'wss://b2a051ac43c4410e86861ed01b937dec.s1.eu.hivemq.cloud:8884/mqtt';
    const clientId = 'web-pub-' + Math.random().toString(16).slice(2);
    const client = mqtt.connect(url, {
      protocol: 'wss',
      username: 'user1',
      password: 'P@ssw0rd',
      clientId,
      clean: true,
      reconnectPeriod: 0,
    });
    client.on('connect', () => {
      client.publish(topicCommands, JSON.stringify(cmd), { qos: 1 }, () => {
        client.end(true);
      });
    });
  };

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h2>STM32 IoT Dashboard</h2>
      
      {/* Connection Status */}
      <div style={{ marginBottom: 16, padding: 8, backgroundColor: connectionStatus === 'Connected' ? '#d4edda' : '#f8d7da', borderRadius: 4 }}>
        <strong>Status:</strong> {connectionStatus}
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: 16 }}>
        <button 
          onClick={() => sendCommand({ led: 'on' })}
          style={{ padding: '8px 16px', marginRight: 8, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Turn LED On
        </button>
        <button 
          onClick={() => sendCommand({ led: 'off' })}
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Turn LED Off
        </button>
      </div>

      {/* Telemetry Data Display */}
      {telemetryData && (
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' }}>
          <h3>Latest Sensor Data</h3>
          <p><strong>Last Updated:</strong> {telemetryData.timestamp}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div><strong>Device Timestamp:</strong> {telemetryData.ts}</div>
            <div><strong>Air Temperature:</strong> {telemetryData.bme_t}°C</div>
            <div><strong>Air Humidity:</strong> {telemetryData.bme_h}%</div>
            <div><strong>Pressure:</strong> {telemetryData.bme_p} hPa</div>
            {telemetryData.ds_t && <div><strong>Soil Temperatures:</strong> {telemetryData.ds_t.join(', ')}°C</div>}
            <div><strong>Soil Moisture 0:</strong> {telemetryData.soil0}%</div>
            <div><strong>Soil Moisture 1:</strong> {telemetryData.soil1}%</div>
            <div><strong>Soil Moisture 2:</strong> {telemetryData.soil2}%</div>
            <div><strong>Water Level 1:</strong> {telemetryData.water1}%</div>
            <div><strong>Water Level 2:</strong> {telemetryData.water2}%</div>
            <div><strong>Valve 1:</strong> {telemetryData.valve1 ? 'ON' : 'OFF'}</div>
            <div><strong>Valve 2:</strong> {telemetryData.valve2 ? 'ON' : 'OFF'}</div>
            <div><strong>Valve 3:</strong> {telemetryData.valve3 ? 'ON' : 'OFF'}</div>
            <div><strong>Pump 1:</strong> {telemetryData.pump1 ? 'ON' : 'OFF'}</div>
            <div><strong>Pump 2:</strong> {telemetryData.pump2 ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      )}

      {/* Raw Messages */}
      <div>
        <h3>Raw MQTT Messages</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: 12, borderRadius: 4, maxHeight: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
          {messages.length === 0 ? 'No messages received yet...' : messages.join('\n')}
        </div>
      </div>
    </div>
  );
}