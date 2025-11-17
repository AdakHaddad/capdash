#!/usr/bin/env python3
"""
MQTT Test Script for Shallot Avatar Animation
Sends different sensor conditions to test all shallot states
"""

import paho.mqtt.client as mqtt
import time
import sys
import os
from pathlib import Path

# Load environment variables from .env.local if it exists
def load_env():
    env_file = Path(__file__).parent / '.env.local'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env()

# MQTT Configuration from environment or defaults
BROKER = os.getenv('MQTT_BROKER', 'test.mosquitto.org')
PORT = int(os.getenv('MQTT_PORT', '1883'))
TOPIC = os.getenv('MQTT_TOPIC', 'd02/data')

# Test scenarios
test_cases = {
    "1": {
        "name": "🌱 Healthy (Happy)",
        "message": "st=25,at=27,sh=70,ah=65,p=825,wl=18,c=1"
    },
    "2": {
        "name": "😰 Stressed (Uncomfortable)",
        "message": "st=28,at=33,sh=48,ah=45,p=820,wl=15,c=2"
    },
    "3": {
        "name": "🔥 Overheated (Panting)",
        "message": "st=32,at=38,sh=60,ah=50,p=815,wl=12,c=3"
    },
    "4": {
        "name": "💧 Thirsty (Wilting)",
        "message": "st=26,at=30,sh=25,ah=55,p=810,wl=10,c=4"
    },
    "5": {
        "name": "🥵 Critical (Shaking)",
        "message": "st=35,at=40,sh=20,ah=30,p=800,wl=8,c=5"
    },
    "6": {
        "name": "🚿 Being Watered",
        "message": "st=24,at=26,sh=85,ah=75,p=830,wl=20,c=6"
    },
    "7": {
        "name": "🥶 Too Cold",
        "message": "st=10,at=12,sh=65,ah=60,p=825,wl=18,c=7"
    },
    "a": {
        "name": "🔄 Auto Cycle (All Conditions)",
        "message": "auto"
    }
}

def on_connect(client, userdata, flags, rc):
    """Callback for when the client receives a CONNACK response from the server."""
    if rc == 0:
        print("✅ Connected to MQTT broker!")
    else:
        print(f"❌ Connection failed with code {rc}")

def send_message(client, message):
    """Send MQTT message"""
    try:
        result = client.publish(TOPIC, message, qos=1)
        result.wait_for_publish()
        print(f"📤 Sent: {message}")
        return True
    except Exception as e:
        print(f"❌ Failed to send message: {e}")
        return False

def auto_cycle(client):
    """Automatically cycle through all conditions"""
    print("\n🔄 Starting auto-cycle through all conditions...")
    print("Press Ctrl+C to stop\n")
    
    conditions = ["1", "2", "3", "4", "5", "6", "7"]
    
    try:
        while True:
            for condition in conditions:
                test = test_cases[condition]
                print(f"\n{test['name']}")
                send_message(client, test["message"])
                time.sleep(5)  # Wait 5 seconds between conditions
    except KeyboardInterrupt:
        print("\n\n⏹️  Auto-cycle stopped")

def main():
    print("=" * 60)
    print("🧅 Shallot Avatar MQTT Test Tool")
    print("=" * 60)
    print(f"Broker: {BROKER}")
    print(f"Topic: {TOPIC}\n")
    
    # Create MQTT client (compatible with older paho-mqtt versions)
    client = mqtt.Client(client_id=f"ShallotTester_{int(time.time())}")
    client.on_connect = on_connect
    
    try:
        print("🔌 Connecting to MQTT broker...")
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        
        # Wait for connection with timeout
        timeout = 10
        start_time = time.time()
        while not client.is_connected() and (time.time() - start_time) < timeout:
            time.sleep(0.5)
        
        if not client.is_connected():
            print("❌ Connection timeout! Make sure you have internet connection.")
            return
        
        while True:
            print("\n" + "=" * 60)
            print("Select a test condition:")
            print("=" * 60)
            for key, test in test_cases.items():
                print(f"  [{key}] {test['name']}")
            print("  [q] Quit")
            print("=" * 60)
            
            choice = input("\nEnter your choice: ").strip().lower()
            
            if choice == 'q':
                print("\n👋 Goodbye!")
                break
            
            if choice in test_cases:
                test = test_cases[choice]
                
                if choice == 'a':
                    auto_cycle(client)
                else:
                    print(f"\n{test['name']}")
                    send_message(client, test["message"])
                    print("✅ Message sent! Check your dashboard.")
            else:
                print("❌ Invalid choice. Please try again.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("🔌 Disconnected from MQTT broker")

if __name__ == "__main__":
    main()
