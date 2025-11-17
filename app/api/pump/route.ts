// =============================================
// Serverless API Route - Pump Control
// File: app/api/pump/route.ts
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, duration_seconds = 0 } = body;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Validate command
    if (!['START', 'STOP', 'POMPA', 'SEDOT'].includes(command?.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid command. Use START, STOP, POMPA, or SEDOT' },
        { status: 400 }
      );
    }

    // MQTT broker configuration
    const MQTT_BROKER = process.env.MQTT_BROKER;
    const MQTT_PORT = parseInt(process.env.MQTT_PORT || '1883');
    const MQTT_TOPIC = process.env.MQTT_TOPIC || 'd02/cmd';
    const MQTT_USERNAME = process.env.MQTT_USERNAME;
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

    // Connect to MQTT broker
    const clientId = `nextjs_api_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const mqttUrl = `mqtt://${MQTT_BROKER}:${MQTT_PORT}`;

    const clientOptions: mqtt.IClientOptions = {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 0, // Don't reconnect, just publish once
    };

    if (MQTT_USERNAME) {
      clientOptions.username = MQTT_USERNAME;
    }
    if (MQTT_PASSWORD) {
      clientOptions.password = MQTT_PASSWORD;
    }

    // Create MQTT client
    const client = mqtt.connect(mqttUrl, clientOptions);

    // Publish message
    const publishPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.end(true);
        reject(new Error('MQTT publish timeout'));
      }, 10000);

      client.on('connect', () => {
        console.log('✅ MQTT connected for API publish');
        
        // Format payload based on command
        let payload: string;
        const cmd = command.toUpperCase();
        
        if (cmd === 'START' || cmd === 'POMPA') {
          payload = duration_seconds > 0 ? `POMPA:${duration_seconds}` : 'POMPA';
        } else if (cmd === 'STOP') {
          payload = 'STOP';
        } else {
          payload = cmd; // SEDOT
        }

        client.publish(MQTT_TOPIC, payload, { qos: 1, retain: false }, async (err) => {
          clearTimeout(timeout);
          client.end(true);
          
          if (err) {
            console.error('❌ MQTT publish error:', err);
            reject(err);
          } else {
            console.log(`✅ Published to ${MQTT_TOPIC}: ${payload}`);
            
            // Save command to database
            const pumpType = (cmd === 'POMPA' || cmd === 'START') ? 'irrigation' : 'suction';
            const { error: dbError } = await supabase
              .from('pump_commands')
              .insert({
                command: cmd,
                pump_type: pumpType,
                duration_seconds: duration_seconds || null,
                executed_at: new Date().toISOString(),
                source: 'api'
              });

            if (dbError) {
              console.error('❌ Failed to save command to DB:', dbError);
            } else {
              console.log('✅ Command saved to database');
            }
            
            resolve({
              success: true,
              message: `Command ${cmd} sent successfully`,
              topic: MQTT_TOPIC,
              payload,
              timestamp: new Date().toISOString(),
            });
          }
        });
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.end(true);
        console.error('❌ MQTT connection error:', err);
        reject(err);
      });
    });

    const result = await publishPromise;
    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send pump command';
    console.error('Pump control API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'Pump Control API',
    usage: 'POST with { "command": "START|STOP|POMPA|SEDOT", "duration_seconds": 300 }',
    timestamp: new Date().toISOString(),
  });
}
