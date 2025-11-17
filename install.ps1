# Irrigation Dashboard - Quick Install Script (Windows)
# Run this script in PowerShell

Write-Host "🌱 Irrigation Dashboard - Quick Install" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Visit: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker found" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath .env -Encoding UTF8
    
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file and add your Supabase credentials!" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue after editing .env file"
}

Write-Host "📥 Pulling Docker image..." -ForegroundColor Cyan
docker pull adakhaddad/irrigation-dashboard:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pulled successfully" -ForegroundColor Green
Write-Host ""

# Stop existing container if running
$existingContainer = docker ps -a --filter "name=irrigation-dashboard" --format "{{.Names}}"
if ($existingContainer -eq "irrigation-dashboard") {
    Write-Host "🔄 Stopping existing container..." -ForegroundColor Yellow
    docker rm -f irrigation-dashboard
}

Write-Host "🚀 Starting container..." -ForegroundColor Cyan
docker run -d `
  --name irrigation-dashboard `
  -p 3000:3000 `
  --env-file .env `
  --restart unless-stopped `
  adakhaddad/irrigation-dashboard:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Dashboard is running at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  View logs:    docker logs -f irrigation-dashboard"
    Write-Host "  Stop:         docker stop irrigation-dashboard"
    Write-Host "  Start:        docker start irrigation-dashboard"
    Write-Host "  Restart:      docker restart irrigation-dashboard"
    Write-Host "  Remove:       docker rm -f irrigation-dashboard"
    Write-Host ""
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}
