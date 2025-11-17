'use client';

import { useState } from 'react';
import mqtt from 'mqtt';

export default function MQTTTestPage() {
  const [status, setStatus] = useState('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState('');

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const testPublish = async () => {
    setTestResult('Testing...');
    addLog('🧪 Starting MQTT publish test');

    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
    if (!brokerUrl) {
      addLog('❌ NEXT_PUBLIC_MQTT_BROKER_URL not configured');
      setTestResult('❌ FAILED: Broker URL not configured in .env');
      return;
    }
    addLog(`🔌 Connecting to: ${brokerUrl}`);

    try {
      const client = mqtt.connect(brokerUrl, {
        clientId: 'TestClient_' + Math.random().toString(16).substring(2, 8),
        reconnectPeriod: 1000,
        connectTimeout: 5000,
      });

      client.on('connect', () => {
        addLog('✅ Connected to broker');
        setStatus('Connected');

        // Try to publish
        const testTopic = process.env.NEXT_PUBLIC_MQTT_TOPIC || 'd02/telemetry';
        const testPayload = 'TEST_' + Date.now();
        
        addLog(`📤 Publishing to ${testTopic}: ${testPayload}`);
        
        client.publish(testTopic, testPayload, { qos: 1 }, (err) => {
          if (err) {
            addLog(`❌ Publish failed: ${err.message}`);
            setTestResult('❌ FAILED: ' + err.message);
          } else {
            addLog('✅ Publish successful!');
            setTestResult('✅ SUCCESS: Message published successfully');
          }
          
          setTimeout(() => {
            client.end();
            setStatus('Disconnected');
          }, 1000);
        });
      });

      client.on('error', (err) => {
        addLog(`❌ Connection error: ${err.message}`);
        setStatus('Error: ' + err.message);
        setTestResult('❌ FAILED: Connection error');
      });

      client.on('close', () => {
        addLog('🔌 Disconnected');
        setStatus('Disconnected');
      });

    } catch (err) {
      const error = err as Error;
      addLog(`❌ Exception: ${error.message}`);
      setTestResult('❌ FAILED: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 MQTT Publish Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-400">Broker:</span>{' '}
              <span className="text-green-400">
                {process.env.NEXT_PUBLIC_MQTT_BROKER_URL || '❌ Not configured'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Test Topic:</span>{' '}
              <span className="text-blue-400">{process.env.NEXT_PUBLIC_MQTT_TOPIC || 'd02/telemetry'}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>{' '}
              <span className={status.includes('Connected') ? 'text-green-400' : 'text-yellow-400'}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={testPublish}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mb-6 w-full"
        >
          🚀 Test Publish
        </button>

        {testResult && (
          <div className={`p-4 rounded-lg mb-6 ${
            testResult.includes('SUCCESS') ? 'bg-green-900/50 border border-green-500' : 'bg-red-900/50 border border-red-500'
          }`}>
            <p className="font-bold">{testResult}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Logs</h2>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click &quot;Test Publish&quot; to start.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <h3 className="font-bold mb-2">💡 Troubleshooting</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>If test fails, check browser console for detailed errors</li>
            <li>Verify broker URL uses <code className="bg-gray-800 px-1 rounded">wss://</code> for HTTPS sites</li>
            <li>Check Vercel/Netlify environment variables are set correctly</li>
            <li>Monitor with: <code className="bg-gray-800 px-1 rounded">mosquitto_sub -h {process.env.MQTT_BROKER} -t &quot;d02/#&quot; -v</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
