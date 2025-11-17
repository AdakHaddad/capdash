#!/bin/bash

# Irrigation Dashboard - Quick Install Script
# This script will pull and run the Docker image

echo "🌱 Irrigation Dashboard - Quick Install"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker found"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "Creating .env file from template..."
    
    cat > .env << 'EOF'
# MQTT Configuration
NEXT_PUBLIC_MQTT_BROKER_URL=ws://test.mosquitto.org:8080
NEXT_PUBLIC_MQTT_TOPIC=d02/telemetry
NEXT_PUBLIC_MQTT_USERNAME=
NEXT_PUBLIC_MQTT_PASSWORD=

# MQTT Backend
MQTT_BROKER=test.mosquitto.org
MQTT_PORT=1883
MQTT_TOPIC=d02/cmd
MQTT_USERNAME=
MQTT_PASSWORD=

# Supabase - PLEASE UPDATE THESE!
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EOF
    
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file and add your Supabase credentials!"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

echo "📥 Pulling Docker image..."
docker pull adakhaddad/irrigation-dashboard:latest

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull Docker image"
    exit 1
fi

echo "✅ Image pulled successfully"
echo ""

# Stop existing container if running
if docker ps -a | grep -q irrigation-dashboard; then
    echo "🔄 Stopping existing container..."
    docker rm -f irrigation-dashboard
fi

echo "🚀 Starting container..."
docker run -d \
  --name irrigation-dashboard \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  adakhaddad/irrigation-dashboard:latest

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "🌐 Dashboard is running at: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker logs -f irrigation-dashboard"
    echo "  Stop:         docker stop irrigation-dashboard"
    echo "  Start:        docker start irrigation-dashboard"
    echo "  Restart:      docker restart irrigation-dashboard"
    echo "  Remove:       docker rm -f irrigation-dashboard"
    echo ""
else
    echo "❌ Failed to start container"
    exit 1
fi
