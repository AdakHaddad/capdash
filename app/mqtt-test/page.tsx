'use client';

import { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

export default function MQTTTest() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('Hello from Web Client!');
  const clientRef = useRef<MqttClient | null>(null);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const MQTT_WSS_URL = 'wss://b2a051ac43c4410e86861ed01b937dec.s1.eu.hivemq.cloud:8884/mqtt';
    const USERNAME = 'user1';
    const PASSWORD = 'P@ssw0rd';

    addMessage('🔌 Connecting to HiveMQ Cloud...');

    const client = mqtt.connect(MQTT_WSS_URL, {
      clientId: 'WebTest_' + Math.random().toString(16).substring(2, 8),
      username: USERNAME,
      password: PASSWORD,
      reconnectPeriod: 3000,
      clean: true,
      connectTimeout: 10000,
      keepalive: 60,
    });

    clientRef.current = client;

    client.on('connect', (connack) => {
      setConnected(true);
      addMessage('✅ Connected to HiveMQ Cloud!');
      addMessage(`Connection details: ${JSON.stringify(connack)}`);
      
      // Subscribe to test topics
      const topics = ['test', 'stm32/data', 'devices/stm32-01/telemetry'];
      topics.forEach(topic => {
        client.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            addMessage(`❌ Subscribe failed for ${topic}: ${err.message}`);
          } else {
            addMessage(`✅ Subscribed to ${topic}`);
          }
        });
      });
    });

    client.on('error', (err) => {
      setConnected(false);
      addMessage(`❌ Connection error: ${err.message}`);
      console.error('MQTT Error:', err);
    });

    client.on('close', () => {
      setConnected(false);
      addMessage('🔌 Connection closed');
    });

    client.on('reconnect', () => {
      addMessage('🔄 Reconnecting...');
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();
      addMessage(`📨 [${topic}] ${message}`);
    });

    return () => {
      client.end();
    };
  }, []);

  const publishTest = () => {
    if (clientRef.current && connected) {
      const topic = 'test';
      clientRef.current.publish(topic, testMessage, { qos: 1 }, (err) => {
        if (err) {
          addMessage(`❌ Publish failed: ${err.message}`);
        } else {
          addMessage(`📤 Published to ${topic}: ${testMessage}`);
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">HiveMQ Cloud MQTT Test</h1>
      
      {/* Connection Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold">
            {connected ? '✅ Connected to HiveMQ Cloud' : '❌ Disconnected'}
          </span>
        </div>
      </div>

      {/* Test Publisher */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Publisher</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Test message"
          />
          <button
            onClick={publishTest}
            disabled={!connected}
            className={`px-6 py-2 rounded text-white font-semibold ${
              connected 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Publish to &quot;test&quot; topic
          </button>
        </div>
      </div>

      {/* Message Log */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Message Log</h2>
        <div className="h-96 overflow-y-auto bg-white p-4 rounded border font-mono text-sm">
          {messages.length === 0 ? (
            <div className="text-gray-500">No messages yet...</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="mb-1">
                {msg}
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setMessages([])}
          className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Wait for connection to HiveMQ Cloud (green dot)</li>
          <li>Click &quot;Publish to test topic&quot; to send a message</li>
          <li>You should see your message appear in the log</li>
          <li>Open a terminal and run: <code className="bg-gray-200 px-1">python test_hivemq_python.py</code></li>
          <li>Messages from Python should appear here too</li>
        </ol>
      </div>
    </div>
  );
}