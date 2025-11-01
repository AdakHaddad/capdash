#!/usr/bin/env python3
"""
Quick test script to send pump command to STM32 via MQTT
Simple format: Just sends "POMPA" or "SEDOT" as plain text
"""

import paho.mqtt.client as mqtt
import time

BROKER = 'test.mosquitto.org'
PORT = 1883
TOPIC = 'd02/cmd'

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to MQTT broker!")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_publish(client, userdata, mid):
    print(f"✅ Message published (mid: {mid})")

def main():
    print("=" * 60)
    print("🚰 STM32 Pump Command Test - Simple Format")
    print("=" * 60)
    print(f"Broker: {BROKER}")
    print(f"Topic: {TOPIC}\n")
    
    # Create MQTT client
    client = mqtt.Client(client_id=f"PumpTester_{int(time.time())}")
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    try:
        print("🔌 Connecting to MQTT broker...")
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        
        # Wait for connection
        time.sleep(2)
        
        if not client.is_connected():
            print("❌ Failed to connect!")
            return
        
        # Test commands - Simple format for easy STM32 parsing
        commands = [
            "POMPA",  # Turn pump ON (irrigation)
            "SEDOT",  # Turn pump to suction mode
        ]
        
        for i, cmd in enumerate(commands, 1):
            print(f"\n{'='*60}")
            print(f"📤 Test {i}/{len(commands)}: Sending '{cmd}'")
            print(f"{'='*60}")
            
            # Publish simple text command
            result = client.publish(TOPIC, cmd, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"✅ Published: {cmd}")
            else:
                print(f"❌ Publish failed with code: {result.rc}")
            
            # Wait between commands
            if i < len(commands):
                print("⏳ Waiting 3 seconds...")
                time.sleep(3)
        
        print(f"\n{'='*60}")
        print("✅ All test commands sent!")
        print(f"{'='*60}")
        print("\n� Monitor your STM32 serial output to see LED changes")
        print("   - POMPA command → LED ON (PC13 LOW)")
        print("   - SEDOT command → LED OFF (PC13 HIGH)")
        
        # Keep connection alive briefly
        time.sleep(2)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("\n🔌 Disconnected from broker")

if __name__ == "__main__":
    main()
