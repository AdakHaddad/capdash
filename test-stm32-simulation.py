#!/usr/bin/env python3
"""
STM32 Data Simulation for Next.js Integration Test
This script simulates the exact data format your STM32 will send
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import ssl
from datetime import datetime

# HiveMQ Cloud Configuration (matching your STM32 and Next.js)
BROKER = "b2a051ac43c4410e86861ed01b937dec.s1.eu.hivemq.cloud"
PORT = 8883  # TLS port
USERNAME = "user1"
PASSWORD = "P@ssw0rd"

# Topic (matching your STM32 and Next.js)
TOPIC_TELEMETRY = "devices/stm32-01/telemetry"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("🌱 STM32 Simulator connected to HiveMQ Cloud!")
        print(f"📡 Publishing to: {TOPIC_TELEMETRY}")
        print("✅ Next.js should now receive simulated STM32 data")
    else:
        print(f"❌ Failed to connect, return code {rc}")

def on_publish(client, userdata, mid):
    print(f"✅ Message {mid} published successfully")

def on_disconnect(client, userdata, rc):
    print("🔌 Disconnected from broker")

def generate_stm32_data(counter):
    """Generate realistic agricultural sensor data"""
    # Simulate realistic agricultural conditions
    base_time = time.time()
    
    # Atmospheric pressure (700-1100 hPa, varies slowly)
    pressure = 1013 + int(50 * math.sin(counter * 0.01)) + random.randint(-20, 20)
    
    # Air temperature (15-40°C, daily cycle)
    air_temp = 25 + int(10 * math.sin(counter * 0.1)) + random.randint(-3, 3)
    
    # Air humidity (30-90%, inversely related to temperature)
    air_humidity = max(30, min(90, 80 - (air_temp - 25) * 2 + random.randint(-10, 10)))
    
    # Soil temperature (follows air temp but more stable)
    soil_temp = air_temp - 2 + random.randint(-2, 2)
    
    # Soil humidity (varies based on irrigation and time)
    if counter % 100 < 20:  # Simulate irrigation cycle
        soil_humidity = 80 + random.randint(-5, 10)
    else:
        soil_humidity = max(20, 80 - (counter % 100) + random.randint(-5, 5))
    
    # Water level (decreases over time, refills periodically)
    water_level = max(5, 90 - (counter % 120) + random.randint(-5, 5))
    
    return {
        "pressure": pressure,
        "soilTemp": soil_temp,
        "soilHumidity": soil_humidity,
        "waterLevel": water_level,
        "airTemp": air_temp,
        "airHumidity": air_humidity,
        "timestamp": str(counter)  # STM32 sends simple counter
    }

def main():
    import math  # Import here to avoid issues
    
    print("🚀 STM32 Data Simulator for Next.js Integration")
    print("=" * 60)
    print(f"🌐 Broker: {BROKER}:{PORT}")
    print(f"🔑 Username: {USERNAME}")
    print(f"📡 Topic: {TOPIC_TELEMETRY}")
    print("=" * 60)
    
    # Create MQTT client
    client = mqtt.Client(client_id=f"stm32-simulator-{random.randint(1000, 9999)}")
    
    # Set credentials
    client.username_pw_set(USERNAME, PASSWORD)
    
    # Enable TLS
    client.tls_set(ca_certs=None, certfile=None, keyfile=None, 
                  cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, 
                  ciphers=None)
    
    # Set callbacks
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    
    try:
        # Connect to broker
        print("🔗 Connecting to HiveMQ Cloud...")
        client.connect(BROKER, PORT, 60)
        
        # Start the loop
        client.loop_start()
        
        # Wait for connection
        time.sleep(3)
        
        counter = 1
        print("🔄 Starting data simulation...")
        print("📱 Open your Next.js app to see real-time data!")
        print("⏰ Publishing every 10 seconds (like STM32)")
        print("🛑 Press Ctrl+C to stop")
        print("-" * 60)
        
        while True:
            # Generate sensor data
            sensor_data = generate_stm32_data(counter)
            payload = json.dumps(sensor_data)
            
            # Publish data
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] 📤 STM32 Data #{counter}:")
            print(f"   🌡️  Air: {sensor_data['airTemp']}°C, {sensor_data['airHumidity']}%")
            print(f"   🌱 Soil: {sensor_data['soilTemp']}°C, {sensor_data['soilHumidity']}%")
            print(f"   💧 Water: {sensor_data['waterLevel']}%")
            print(f"   🔘 Pressure: {sensor_data['pressure']} hPa")
            
            result = client.publish(TOPIC_TELEMETRY, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"   ✅ Published to Next.js dashboard")
            else:
                print(f"   ❌ Publish failed: {result.rc}")
            
            print("-" * 60)
            counter += 1
            time.sleep(10)  # 10 second interval like STM32
    
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check your internet connection")
        print("2. Verify HiveMQ Cloud credentials")
        print("3. Make sure your Next.js app is running")
    finally:
        client.loop_stop()
        client.disconnect()
        print("👋 STM32 Simulator disconnected")

if __name__ == "__main__":
    main()