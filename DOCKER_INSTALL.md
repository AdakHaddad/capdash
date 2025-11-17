# 🐳 Docker Installation Guide - Ringkasan

## Pilihan Instalasi Docker

### 1️⃣ Quick Install Script (RECOMMENDED) ⚡

**Paling mudah dan cepat!**

**Windows:**
```powershell
irm https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/install.ps1 | iex
```

**Linux/Mac:**
```bash
curl -fsSL https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/install.sh | bash
```

✅ Otomatis pull image, setup .env, dan run container!

---

### 2️⃣ Docker Pull & Run Manual

```bash
# 1. Pull image
docker pull adakhaddad/irrigation-dashboard:latest

# 2. Buat .env file (edit dengan credentials Anda)
cat > .env << EOF
NEXT_PUBLIC_MQTT_BROKER_URL=ws://test.mosquitto.org:8080
NEXT_PUBLIC_MQTT_TOPIC=d02/telemetry
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
EOF

# 3. Run container
docker run -d \
  --name irrigation-dashboard \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  adakhaddad/irrigation-dashboard:latest

# 4. Akses http://localhost:3000
```

---

### 3️⃣ Docker Compose dengan Pre-built Image

```bash
# 1. Download file
curl -O https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/docker-compose.image.yml
curl -O https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/.env.example

# 2. Setup .env
cp .env.example .env
# Edit .env dengan credentials Anda

# 3. Run
docker-compose -f docker-compose.image.yml up -d
```

---

### 4️⃣ Build dari Source Code

```bash
# 1. Clone repo
git clone https://github.com/AdakHaddad/capdash.git
cd capdash/nextjs

# 2. Setup .env
cp .env.example .env
# Edit .env

# 3. Build & Run
docker-compose build
docker-compose up -d
```

---

## Perintah Docker Berguna

```bash
# Lihat logs
docker logs -f irrigation-dashboard

# Stop container
docker stop irrigation-dashboard

# Start container
docker start irrigation-dashboard

# Restart container
docker restart irrigation-dashboard

# Hapus container
docker rm -f irrigation-dashboard

# Update ke versi terbaru
docker pull adakhaddad/irrigation-dashboard:latest
docker rm -f irrigation-dashboard
# Jalankan ulang container
```

---

## Troubleshooting

### Port 3000 sudah digunakan

```bash
# Gunakan port lain, misal 3001
docker run -d \
  --name irrigation-dashboard \
  -p 3001:3000 \
  --env-file .env \
  adakhaddad/irrigation-dashboard:latest

# Akses: http://localhost:3001
```

### Container tidak bisa start

```bash
# Lihat logs untuk detail error
docker logs irrigation-dashboard

# Check apakah .env valid
cat .env

# Restart Docker Desktop (Windows/Mac)
```

### Update ke versi terbaru

```bash
# Pull latest image
docker pull adakhaddad/irrigation-dashboard:latest

# Stop dan hapus container lama
docker rm -f irrigation-dashboard

# Jalankan ulang dengan image baru
docker run -d \
  --name irrigation-dashboard \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  adakhaddad/irrigation-dashboard:latest
```

---

## Platform Support

Docker image mendukung:
- ✅ **Linux** (x86_64, ARM64)
- ✅ **Windows** (Docker Desktop)
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Raspberry Pi** (ARM64)

---

## Resource Requirements

**Minimum:**
- RAM: 512 MB
- CPU: 1 core
- Disk: 500 MB

**Recommended:**
- RAM: 1 GB
- CPU: 2 cores
- Disk: 1 GB

---

## Next Steps

Setelah instalasi:

1. ✅ Buka http://localhost:3000
2. ✅ Setup Supabase database (jalankan SQL files)
3. ✅ Konfigurasi STM32 untuk connect ke MQTT broker
4. ✅ Test pump control dan monitoring

Lihat [README.md](README.md) untuk dokumentasi lengkap!
