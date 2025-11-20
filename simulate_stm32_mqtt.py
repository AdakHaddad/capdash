#!/usr/bin/env python3
"""
STM32 MQTT Simulator
Simulates STM32 publishing telemetry data to MQTT broker
Format: {"ts":175938,"mode":"AUTO","bme":{...},"ds18b20":[...],"soil":[...],"water":[...],"valve":[...],"pump":[...]}
"""

import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT Configuration - Using test.mosquitto.org public broker
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883  # Standard MQTT TCP port (backend uses this, web uses 8083 WSS)
MQTT_TOPIC = "d02/telemetry"
MQTT_QOS = 0

# Simulation settings
PUBLISH_INTERVAL = 5  # seconds
MODE = "AUTO"  # AUTO, MANUAL, SCHEDULE

def generate_telemetry_data():
    """Generate realistic sensor data in STM32 format"""
    
    # Timestamp (milliseconds since boot)
    timestamp = int(time.time() * 1000) % 10000000
    
    # BME280 sensor (temperature, pressure, humidity)
    bme_temp = round(random.uniform(24.0, 28.0), 2)
    bme_pressure = random.randint(995, 1005)
    bme_humidity = round(random.uniform(50.0, 70.0), 1)
    
    # DS18B20 soil temperature sensors (3 sensors, -127 means error/disconnected)
    ds18b20 = [
        -127.00,  # Sensor 1 - disconnected
        0.00,     # Sensor 2 - not initialized
        0.00      # Sensor 3 - not initialized
    ]
    
    # Soil moisture sensors (3 sensors, 0-100%)
    soil = [
        random.randint(95, 100),
        random.randint(95, 100),
        random.randint(95, 100)
    ]
    
    # Water level sensors (2 sensors, 0-100%)
    water = [
        round(random.uniform(0.1, 2.0), 1),
        round(random.uniform(0.1, 2.0), 1)
    ]
    
    # Valve states (3 valves, 0=OFF, 1=ON)
    valve = [0, 0, 0]
    
    # Pump states (2 pumps: irrigation, suction - 0=OFF, 1=ON)
    pump = [0, 0]  # Both OFF by default
    
    # Randomly turn on pumps (10% chance)
    if random.random() < 0.1:
        pump[0] = 1  # Irrigation ON
    if random.random() < 0.05:
        pump[1] = 1  # Suction ON
    
    # Build JSON payload
    payload = {
        "ts": timestamp,
        "mode": MODE,
        "bme": {
            "t": bme_temp,
            "p": bme_pressure,
            "h": bme_humidity
        },
        "ds18b20": ds18b20,
        "soil": soil,
        "water": water,
        "valve": valve,
        "pump": pump
    }
    
    return payload

def on_connect(client, userdata, flags, rc, properties):
    """Callback when connected to MQTT broker (API VERSION2)"""
    if rc == 0:
        print(f"✅ Connected to MQTT broker: {MQTT_BROKER}")
        print(f"📡 Publishing to topic: {MQTT_TOPIC}")
        print(f"⏱️  Interval: {PUBLISH_INTERVAL} seconds")
        print("-" * 60)
    else:
        print(f"❌ Failed to connect, return code: {rc}")

def on_publish(client, userdata, mid, rc, properties):
    """Callback when message is published (API VERSION2)"""
    pass

def on_disconnect(client, userdata, flags, rc, properties):
    """Callback when disconnected from MQTT broker (API VERSION2)"""
    if rc != 0:
        print(f"⚠️  Unexpected disconnection. Reconnecting...")

def main():
    """Main function to simulate STM32 MQTT publishing"""
    
    print("=" * 60)
    print("🌱 STM32 MQTT Simulator")
    print("=" * 60)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {MQTT_TOPIC}")
    print(f"QoS: {MQTT_QOS}")
    print(f"Mode: {MODE}")
    print("=" * 60)
    print()
    
    # Create MQTT client (standard TCP)
    client = mqtt.Client(
        client_id=f"STM32_Simulator_{random.randint(1000, 9999)}",
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    
    try:
        # Connect to broker
        print(f"🔌 Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Start network loop
        client.loop_start()
        
        # Wait for connection
        time.sleep(2)
        
        # Publish loop
        message_count = 0
        while True:
            # Generate telemetry data
            telemetry = generate_telemetry_data()
            
            # Convert to JSON string
            payload_json = json.dumps(telemetry, separators=(',', ':'))
            
            # Publish to MQTT
            result = client.publish(MQTT_TOPIC, payload_json, qos=MQTT_QOS)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                message_count += 1
                timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                
                print(f"📤 [{message_count}] {timestamp_str}")
                print(f"   Topic: {MQTT_TOPIC}")
                print(f"   QoS: {MQTT_QOS}")
                print(f"   Payload: {payload_json}")
                print(f"   Temp: {telemetry['bme']['t']}°C | Pressure: {telemetry['bme']['p']}hPa | Humidity: {telemetry['bme']['h']}%")
                print(f"   Soil: {telemetry['soil']} | Water: {telemetry['water']} | Pumps: {telemetry['pump']}")
                print()
            else:
                print(f"❌ Failed to publish message: {result.rc}")
            
            # Wait before next publish
            time.sleep(PUBLISH_INTERVAL)
            
    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print(f"🛑 Stopped by user. Total messages sent: {message_count}")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Cleanup
        client.loop_stop()
        client.disconnect()
        print("👋 Disconnected from MQTT broker")

if __name__ == "__main__":
    main()
