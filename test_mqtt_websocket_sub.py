#!/usr/bin/env python3
"""
Test MQTT WebSocket Subscriber
Subscribe to d02/telemetry via WebSocket to see if messages arrive
"""

import paho.mqtt.client as mqtt
import time

MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 8080
MQTT_TOPIC = "d02/telemetry"

def on_connect(client, userdata, flags, rc):
    """Callback when connected"""
    if rc == 0:
        print(f"✅ Connected to {MQTT_BROKER}:{MQTT_PORT} (WebSocket)")
        print(f"📡 Subscribing to: {MQTT_TOPIC}")
        client.subscribe(MQTT_TOPIC, qos=0)
        print("⏳ Waiting for messages...")
        print("-" * 60)
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback when message received"""
    print(f"📨 Message received!")
    print(f"   Topic: {msg.topic}")
    print(f"   Payload: {msg.payload.decode()}")
    print("-" * 60)

def on_subscribe(client, userdata, mid, granted_qos):
    """Callback when subscribed"""
    print(f"✅ Subscribed successfully (QoS: {granted_qos[0]})")

def main():
    print("=" * 60)
    print("🔍 MQTT WebSocket Test Subscriber")
    print("=" * 60)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT} (WebSocket)")
    print(f"Topic: {MQTT_TOPIC}")
    print("=" * 60)
    print()
    
    try:
        # Create WebSocket client
        client = mqtt.Client(
            client_id=f"TestSub_{int(time.time())}",
            transport="websockets",
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1
        )
        
        client.on_connect = on_connect
        client.on_message = on_message
        client.on_subscribe = on_subscribe
        
        # Set WebSocket path
        client.ws_set_options(path="/mqtt")
        
        # Connect
        print(f"🔌 Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Start loop
        client.loop_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
