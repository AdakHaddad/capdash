# Vercel Deployment Guide

## 🚀 Deploying to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add MQTT environment configuration"
git push origin main
```

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard: https://vercel.com/adakhaddad/capdash
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_MQTT_BROKER_URL` | `wss://test.mosquitto.org:8081` | Production, Preview, Development |
| `NEXT_PUBLIC_MQTT_TOPIC` | `telemetry/stm32/data` | Production, Preview, Development |

### Step 3: Redeploy

After adding environment variables, trigger a new deployment:

**Option A: Via Vercel Dashboard**
- Go to **Deployments** tab
- Click the **⋯** menu on the latest deployment
- Select **Redeploy**

**Option B: Push a new commit**
```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

## 🔐 HTTPS vs HTTP

### The Issue
- Vercel deploys sites over **HTTPS** (`https://capdash.vercel.app`)
- Browsers block **insecure WebSocket** (`ws://`) connections from HTTPS pages
- Solution: Use **secure WebSocket** (`wss://`)

### Port Differences
- **HTTP + WebSocket**: `ws://test.mosquitto.org:8080`
- **HTTPS + Secure WebSocket**: `wss://test.mosquitto.org:8081`

### Auto-Detection Feature
The app now automatically detects the page protocol:
```typescript
const isSecure = window.location.protocol === 'https:';
const defaultBroker = isSecure 
  ? 'wss://test.mosquitto.org:8081'  // For HTTPS
  : 'ws://test.mosquitto.org:8080';   // For HTTP
```

## 🧪 Testing After Deployment

1. Open browser console on https://capdash.vercel.app
2. Look for: `🔌 Connecting to MQTT: wss://test.mosquitto.org:8081`
3. Should see: `✅ MQTT connected to test.mosquitto.org`
4. Send test data with Python script:
   ```bash
   python test_shallot_mqtt.py
   ```
5. Shallot avatar should update in real-time! 🧅

## 🐛 Troubleshooting

### Still seeing "Mixed Content" error?
- Check environment variables are set correctly in Vercel
- Redeploy after setting variables
- Clear browser cache (Ctrl+Shift+R)

### MQTT not connecting?
- Verify wss://test.mosquitto.org:8081 is accessible
- Check browser console for connection errors
- Try alternative public broker (see below)

### Alternative MQTT Brokers

If test.mosquitto.org is down, try these:

**HiveMQ Public Broker**
```
NEXT_PUBLIC_MQTT_BROKER_URL=wss://broker.hivemq.com:8884
```

**Eclipse Public Broker**
```
NEXT_PUBLIC_MQTT_BROKER_URL=wss://mqtt.eclipseprojects.io:443/mqtt
```

## 📝 Environment Files Summary

- `.env` - Base configuration (version controlled)
- `.env.local` - Local development overrides (NOT in git)
- `.env.production` - Production defaults (version controlled)
- `.env.example` - Template for developers (version controlled)
- **Vercel Dashboard** - Production environment variables (highest priority)

## 🔄 Development Workflow

**Local Development (HTTP)**
```bash
npm run dev
# Uses ws://test.mosquitto.org:8080 (or .env.local override)
```

**Production Build Test**
```bash
npm run build
npm start
# Uses wss:// if accessed via HTTPS
```

**Vercel Deployment**
- Automatically uses production environment variables
- Auto-detects HTTPS and uses wss://
- No manual configuration needed after initial setup
