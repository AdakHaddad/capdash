# MQTT Setup for Vercel/Netlify Deployment

## Problem
When deployed to Vercel/Netlify (HTTPS), the dashboard cannot publish MQTT commands because:
1. HTTPS pages require secure WebSocket (WSS) connections
2. Public broker `test.mosquitto.org:8081` (WSS) may have publishing restrictions
3. Browser security blocks insecure (WS) connections on HTTPS pages

## Solutions

### Option 1: Use HiveMQ Public Broker (Recommended)

HiveMQ offers a reliable public WSS broker that works well with Vercel/Netlify.

#### 1. Update Environment Variables in Vercel/Netlify

Add to your deployment settings:

```env
NEXT_PUBLIC_MQTT_BROKER_URL=wss://test.mosquitto.org:8884/mqtt
NEXT_PUBLIC_MQTT_TOPIC=d02/data
```

#### 2. Update STM32 Connection

In your STM32 code, change broker to:
```c
// ESP8266 AT command
AT+MQTTUSERCFG=0,1,"STM32_Client","","",0,0,""
AT+MQTTCONN=0,"test.mosquitto.org",1883,0
```

**Note:** STM32 uses TCP port 1883, dashboard uses WSS port 8884

---

### Option 2: Use Eclipse Mosquitto WSS (Alternative)

Keep using `test.mosquitto.org` but with proper configuration.

#### Environment Variables:
```env
NEXT_PUBLIC_MQTT_BROKER_URL=wss://test.mosquitto.org:8081
NEXT_PUBLIC_MQTT_TOPIC=d02/data
```

**Limitations:**
- Port 8081 may have rate limits
- Publishing might be restricted
- Less reliable for production

---

### Option 3: Self-Hosted MQTT Broker (Production)

For production deployment, host your own MQTT broker.

#### A. Using HiveMQ Cloud (Free Tier)

1. Sign up at [https://www.hivemq.com/mqtt-cloud-broker/](https://www.hivemq.com/mqtt-cloud-broker/)
2. Create a cluster (free tier available)
3. Get your credentials
4. Configure environment variables:

```env
NEXT_PUBLIC_MQTT_BROKER_URL=wss://your-cluster.hivemq.cloud:8884/mqtt
NEXT_PUBLIC_MQTT_USERNAME=your-username
NEXT_PUBLIC_MQTT_PASSWORD=your-password
NEXT_PUBLIC_MQTT_TOPIC=d02/data
```

#### B. Using AWS IoT Core

1. Create AWS IoT Thing
2. Generate certificates
3. Configure dashboard with AWS IoT endpoint

---

## Quick Test: Verify WSS Publishing

### 1. Test in Browser Console (on deployed site)

```javascript
// Open browser DevTools Console on your deployed site
const mqtt = require('mqtt');
const client = mqtt.connect('wss://test.mosquitto.org:8884/mqtt');

client.on('connect', () => {
  console.log('✅ Connected');
  client.publish('d02/cmd', 'TEST', {qos: 1}, (err) => {
    if (err) console.error('❌ Publish failed:', err);
    else console.log('✅ Published successfully');
  });
});
```

### 2. Monitor with MQTT Client

Subscribe from your computer to see if messages arrive:

```bash
mosquitto_sub -h test.mosquitto.org -t "d02/#" -v
```

---

## Current Architecture

```
┌─────────────────────┐
│   Vercel/Netlify    │
│   (HTTPS)           │
│   Dashboard         │
└──────┬──────────────┘
       │
       │ WSS (Port 8884)
       │ Publishing: d02/cmd
       │ Subscribing: d02/data, d02/status
       │
       ↓
┌─────────────────────┐
│   MQTT Broker       │
│   (broker.hivemq    │
│    .com)            │
└──────┬──────────────┘
       │
       │ TCP (Port 1883)
       │ Publishing: d02/data, d02/status
       │ Subscribing: d02/cmd
       │
       ↓
┌─────────────────────┐
│   STM32 + ESP8266   │
│   (Irrigation       │
│    Controller)      │
└─────────────────────┘
```

---

## Troubleshooting

### Issue: "WebSocket connection failed"

**Cause:** Browser blocking insecure WS on HTTPS
**Solution:** Use WSS broker URL

### Issue: "Publish successful but STM32 not receiving"

**Cause:** Dashboard and STM32 using different brokers
**Solution:** Ensure both use same broker (e.g., both use `test.mosquitto.org`)

### Issue: "Connection timeout"

**Cause:** Firewall or network blocking ports
**Solution:** 
- Check port 8884 (WSS) is not blocked
- Try different broker
- Check browser console for CORS errors

### Issue: "Messages received but can't publish"

**Cause:** Broker restricts publishing on WSS
**Solution:** Switch to HiveMQ or self-hosted broker

---

## Recommended Production Setup

### For Vercel Deployment:

1. **Use HiveMQ Public Broker** (easiest)
   ```env
   NEXT_PUBLIC_MQTT_BROKER_URL=wss://test.mosquitto.org:8884/mqtt
   ```

2. **Add Environment Variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_MQTT_BROKER_URL`
   - Add `NEXT_PUBLIC_MQTT_TOPIC=d02/data`

3. **Update STM32 Code**:
   - Change broker to `test.mosquitto.org`
   - Keep port 1883 (TCP)
   - Topics remain: `d02/data`, `d02/cmd`

4. **Redeploy** both dashboard and STM32 firmware

### Testing Steps:

1. Deploy to Vercel
2. Open browser DevTools → Console
3. Click pump button
4. Check console for "✅ MQTT published → d02/cmd: POMPA"
5. Monitor STM32 serial output for incoming message

---

## Environment Variable Summary

### Local Development (.env.local)
```env
NEXT_PUBLIC_MQTT_BROKER_URL=ws://test.mosquitto.org:8080
NEXT_PUBLIC_MQTT_TOPIC=d02/data
```

### Production (Vercel/Netlify)
```env
NEXT_PUBLIC_MQTT_BROKER_URL=wss://test.mosquitto.org:8884/mqtt
NEXT_PUBLIC_MQTT_TOPIC=d02/data
```

---

## Alternative: Proxy MQTT through Vercel API

If you can't use WSS directly, create an API route to proxy MQTT:

**File:** `app/api/mqtt-publish/route.ts`

```typescript
import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

export async function POST(request: Request) {
  const { topic, payload } = await request.json();
  
  const client = mqtt.connect('mqtt://test.mosquitto.org:1883');
  
  return new Promise((resolve) => {
    client.on('connect', () => {
      client.publish(topic, payload, { qos: 1 }, (err) => {
        client.end();
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true }));
        }
      });
    });
  });
}
```

Then call from dashboard:
```typescript
await fetch('/api/mqtt-publish', {
  method: 'POST',
  body: JSON.stringify({ topic: 'd02/cmd', payload: 'POMPA' })
});
```

---

## Need Help?

- Check browser console for detailed error messages
- Monitor STM32 serial output for incoming messages
- Test with `mosquitto_sub` to verify broker connectivity
- Join HiveMQ community forum for broker-specific issues
