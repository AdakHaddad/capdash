@echo off
echo ===============================================
echo      Starting STM32 Smart Farm Web Client
echo ===============================================
echo.
echo This web client will receive data from:
echo - Real STM32 hardware via HiveMQ Cloud
echo - Python simulator for testing
echo.
echo 🌐 URL: http://localhost:3000
echo 📡 MQTT: HiveMQ Cloud WebSocket
echo 🔑 Credentials: user1 / P@ssw0rd
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

cd /d "c:\Users\LENOVO\Documents\capdash\nextjs"

echo Starting Next.js development server...
npm run dev

pause