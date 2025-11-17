## 🚀 Quick Fix for Vercel Deployment

### Problem
After deploying to Vercel (https://capdash.vercel.app), MQTT doesn't connect because:
1. No environment variables set in Vercel
2. Mixed content error (HTTPS → WS insecure WebSocket)

### Solution - Set Environment Variables in Vercel

#### Step 1: Go to Vercel Dashboard
https://vercel.com/adakhaddad/capdash/settings/environment-variables

#### Step 2: Add This Variable

**Variable Name:**
```
NEXT_PUBLIC_MQTT_BROKER_URL
```

**Value:**
```
wss://test.mosquitto.org:8081
```

**Environments:** Select all three:
- ✅ Production
- ✅ Preview  
- ✅ Development

#### Step 3: Redeploy

**Option A - From Vercel Dashboard:**
1. Go to: https://vercel.com/adakhaddad/capdash
2. Click **Deployments** tab
3. Click **⋯** (three dots) on latest deployment
4. Select **Redeploy**
5. Click **Redeploy** button

**Option B - Push to GitHub:**
```bash
git add .
git commit -m "Fix MQTT for production deployment"
git push origin main
```

### Why wss:// instead of ws://?

| Environment | Protocol | Port | URL |
|------------|----------|------|-----|
| **Local (HTTP)** | `ws://` | 8080 | `ws://test.mosquitto.org:8080` |
| **Production (HTTPS)** | `wss://` | 8081 | `wss://test.mosquitto.org:8081` |

**Browsers block insecure WebSocket (ws://) from HTTPS pages!**

### Verify It Works

After redeploying:

1. Open: https://capdash.vercel.app
2. Open browser console (F12)
3. Look for:
   ```
   🔌 Connecting to MQTT: wss://test.mosquitto.org:8081
   ✅ MQTT connected to test.mosquitto.org
   ```

4. You should see:
   - 🟢 Green indicator = Connected
   - Shallot avatar updates in real-time
   - No "Mixed Content" errors

### Test with Python Script

```bash
python test_shallot_mqtt.py
```

Send condition #7 (cold) to see the shallot shiver with ice particles! ❄️

---

## Alternative: No Environment Variable Needed

The code now auto-detects HTTPS and uses `wss://` automatically!

If you don't set the environment variable, it will use:
- `wss://test.mosquitto.org:8081` for HTTPS (production)
- `ws://test.mosquitto.org:8080` for HTTP (local dev)

**So technically, you can just redeploy and it should work!** 🎉

But setting the env var gives you more control to use different brokers later.
