# Environment Configuration

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your configuration

## Environment Variables

### Next.js (Web Dashboard)
- `NEXT_PUBLIC_MQTT_BROKER_URL` - WebSocket MQTT broker URL (e.g., `ws://test.mosquitto.org:8080`)
- `NEXT_PUBLIC_MQTT_TOPIC` - MQTT topic for telemetry data (default: `telemetry/stm32/data`)
- `NEXT_PUBLIC_API_BASE` - API backend URL (default: `http://localhost:3001`)

### Python Scripts
- `MQTT_BROKER` - MQTT broker hostname (e.g., `test.mosquitto.org`)
- `MQTT_PORT` - MQTT broker port (default: `1883` for native MQTT)
- `MQTT_TOPIC` - MQTT topic for telemetry data (default: `telemetry/stm32/data`)

## Default Configuration

The default configuration connects to the public test.mosquitto.org broker:
- **WebSocket**: `ws://test.mosquitto.org:8080` (for web browsers)
- **Native MQTT**: `test.mosquitto.org:1883` (for Python/embedded devices)
- **Topic**: `telemetry/stm32/data`

## Custom MQTT Broker

To use your own MQTT broker (e.g., HiveMQ Cloud, AWS IoT, Azure IoT Hub):

1. Update `.env.local`:
```bash
# For Next.js
NEXT_PUBLIC_MQTT_BROKER_URL=wss://your-broker.com:8884
NEXT_PUBLIC_MQTT_TOPIC=your/custom/topic

# For Python
MQTT_BROKER=your-broker.com
MQTT_PORT=8883
MQTT_TOPIC=your/custom/topic
```

2. Add authentication if needed (modify code to include username/password)

3. Restart the development server:
```bash
npm run dev
```

## Security Notes

- **Never commit `.env.local`** to version control (it's in `.gitignore`)
- Use `.env.example` to document required variables
- For production, use environment variables from your hosting platform
- Use TLS/SSL (`wss://` and port 8883/8884) for sensitive data
