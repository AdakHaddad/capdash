# 🌱 Smart Irrigation Control Dashboard

Dashboard kontrol irigasi cerdas berbasis IoT dengan monitoring real-time sensor, kontrol pompa otomatis, dan penjadwalan menggunakan Next.js, MQTT, dan Supabase.

## ✨ Fitur

- 📊 **Real-time Monitoring**: Sensor suhu, kelembaban tanah, kelembaban udara, tekanan, dan level air
- 💧 **Kontrol Pompa**: Kontrol manual pompa irigasi dan pompa sedot
- 📅 **Penjadwalan**: Jadwal irigasi harian dan satu kali dengan calendar view
- 🤖 **Mode Auto**: AI-powered irrigation recommendation
- 📈 **History**: Grafik history sensor data
- 🎨 **Mascot Avatar**: Animated shallot character yang menunjukkan kondisi tanaman
- 📱 **Responsive Design**: Mobile-first design dengan Tailwind CSS
- 🔄 **MQTT Integration**: Real-time communication dengan STM32 via MQTT
- 💾 **Database Logging**: Semua command dan schedule tersimpan di Supabase

## 📋 Prerequisites

- **Node.js** 18.x atau lebih baru
- **npm** atau **yarn** atau **pnpm**
- **Supabase Account** (gratis)
- **MQTT Broker** (test.mosquitto.org atau test.mosquitto.org)
- **STM32** dengan sensor BME280, DS18B20, soil moisture, water level (opsional)

## 🚀 Instalasi Manual

### 1. Clone Repository

```bash
git clone https://github.com/AdakHaddad/capdash.git
cd capdash/nextjs
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Setup Environment Variables

Buat file `.env` di root folder:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:

```properties
# MQTT Broker Configuration
NEXT_PUBLIC_MQTT_BROKER_URL=ws://test.mosquitto.org:8080
NEXT_PUBLIC_MQTT_TOPIC=d02/telemetry
NEXT_PUBLIC_MQTT_USERNAME=
NEXT_PUBLIC_MQTT_PASSWORD=

# MQTT Broker (untuk API routes)
MQTT_BROKER=test.mosquitto.org
MQTT_PORT=1883
MQTT_TOPIC=d02/cmd
MQTT_USERNAME=
MQTT_PASSWORD=

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Setup Supabase Database

1. Buka [Supabase Dashboard](https://supabase.com)
2. Buat project baru atau gunakan yang sudah ada
3. Pergi ke **SQL Editor**
4. Jalankan file SQL berikut secara berurutan:

**a. Setup Schedules Table:**
```bash
# Copy dan jalankan isi file:
supabase_setup.sql
supabase_schedules_setup.sql
```

**b. Setup Pump Commands Table:**
```bash
# Copy dan jalankan isi file:
supabase_pump_commands.sql
```

### 5. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 6. Build untuk Production

```bash
npm run build
npm start
```

## 🐳 Instalasi dengan Docker

### Prerequisites Docker

- **Docker** 20.x atau lebih baru
- **Docker Compose** 2.x atau lebih baru (opsional)

### ⚡ Quick Install (Tercepat!)

Gunakan script otomatis untuk instalasi cepat:

**Windows (PowerShell):**
```powershell
# Download dan jalankan script
irm https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/install.ps1 | iex
```

**Linux/Mac:**
```bash
# Download dan jalankan script
curl -fsSL https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/install.sh | bash
```

Script ini akan otomatis:
- ✅ Check Docker installation
- ✅ Create .env file template
- ✅ Pull Docker image
- ✅ Run container
- ✅ Open dashboard at http://localhost:3000

### Metode 1: Menggunakan Docker Image (Manual)

Cara paling cepat tanpa perlu clone repository atau build.

#### 1. Download Docker Image

```bash
# Pull image dari Docker Hub
docker pull adakhaddad/irrigation-dashboard:latest
```

#### 2. Buat File Environment Variables

Buat file `.env` di folder pilihan Anda:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

Edit `.env` dengan konfigurasi Anda:

```properties
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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 3. Jalankan Container

```bash
# Windows PowerShell
docker run -d `
  --name irrigation-dashboard `
  -p 3000:3000 `
  --env-file .env `
  --restart unless-stopped `
  adakhaddad/irrigation-dashboard:latest

# Linux/Mac
docker run -d \
  --name irrigation-dashboard \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  adakhaddad/irrigation-dashboard:latest
```

#### 4. Akses Dashboard

Buka browser dan akses: [http://localhost:3000](http://localhost:3000)

#### 5. Perintah Docker Lainnya

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
# Jalankan ulang dengan perintah docker run di atas
```

### Metode 2: Build dari Source Code

#### 1. Clone Repository

```bash
git clone https://github.com/AdakHaddad/capdash.git
cd capdash/nextjs
```

#### 2. Setup Environment Variables

Buat file `.env` seperti pada instalasi manual di atas.

#### 3. Build dan Run dengan Docker Compose

```bash
# Build image
docker-compose build

# Jalankan container
docker-compose up -d

# Lihat logs
docker-compose logs -f
```

Dashboard akan berjalan di [http://localhost:3000](http://localhost:3000)

#### 4. Stop Container

```bash
docker-compose down
```

### Metode 3: Docker Compose dengan Pre-built Image

Cara termudah menggunakan Docker Compose tanpa build.

#### 1. Download File Konfigurasi

```bash
# Download docker-compose.image.yml dan .env.example
curl -O https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/docker-compose.image.yml
curl -O https://raw.githubusercontent.com/AdakHaddad/capdash/main/nextjs/.env.example
```

#### 2. Setup Environment

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dengan konfigurasi Anda
```

#### 3. Jalankan dengan Docker Compose

```bash
# Jalankan container
docker-compose -f docker-compose.image.yml up -d

# Lihat logs
docker-compose -f docker-compose.image.yml logs -f

# Stop
docker-compose -f docker-compose.image.yml down
```

### Docker Commands Lainnya

```bash
# Rebuild tanpa cache (untuk source code)
docker-compose build --no-cache

# Restart container
docker-compose restart

# Lihat container yang berjalan
docker-compose ps

# Masuk ke container
docker-compose exec app sh

# Lihat resource usage
docker stats irrigation-dashboard
```

### 🔨 Build Docker Image Sendiri (untuk Developer)

Jika ingin build dan push image sendiri ke Docker Hub:

```bash
# 1. Login ke Docker Hub
docker login

# 2. Build image dengan tag
docker build -t yourusername/irrigation-dashboard:latest .

# 3. Test image lokal
docker run -p 3000:3000 --env-file .env yourusername/irrigation-dashboard:latest

# 4. Push ke Docker Hub
docker push yourusername/irrigation-dashboard:latest

# 5. Build multi-platform (ARM + x86)
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t yourusername/irrigation-dashboard:latest \
  --push .
```

# Masuk ke container
docker-compose exec app sh
```

### Dockerfile Manual (tanpa Docker Compose)

```bash
# Build image
docker build -t irrigation-dashboard .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  --name irrigation-app \
  irrigation-dashboard

# Stop container
docker stop irrigation-app
docker rm irrigation-app
```

## 📁 Struktur Project

```
nextjs/
├── app/
│   ├── api/              # API routes
│   │   ├── pump/         # Pump control API
│   │   ├── schedule/     # Schedule API
│   │   └── sensors/      # Sensor data API
│   ├── components/       # React components
│   │   ├── ManualControl.tsx
│   │   ├── ScheduleCalendar.tsx
│   │   ├── SensorHistory.tsx
│   │   └── ShallotAvatar.tsx
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard
├── lib/
│   └── supabase/
│       └── client.ts     # Supabase client
├── public/               # Static assets
├── .env                  # Environment variables
├── package.json
├── next.config.mjs
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

## 🔧 Konfigurasi MQTT

### Format Message dari STM32

**Telemetry (Topic: `d02/telemetry`):**
```json
{
  "ts": 1288664,
  "mode": "AUTO",
  "bme": {"t": 25.02, "p": 997, "h": 57.2},
  "ds18b20": [-127.00, 0.00, 0.00],
  "soil": [100, 100, 100],
  "water": [0.1, 1.8],
  "valve": [0, 0, 0],
  "pump": [0, 0]
}
```

**Commands (Topic: `d02/cmd`):**
- `POMPA` - Nyalakan pompa irigasi
- `SEDOT` - Nyalakan pompa sedot
- `STOP` - Matikan semua pompa
- `AUTO` - Mode otomatis
- `RESUME` - Lanjutkan jadwal

### Test MQTT Connection

Gunakan MQTT client seperti MQTT Explorer atau mosquitto_sub:

```bash
# Subscribe ke telemetry
mosquitto_sub -h test.mosquitto.org -t "d02/telemetry" -v

# Publish command
mosquitto_pub -h test.mosquitto.org -t "d02/cmd" -m "POMPA"
```

## 📱 Penggunaan

### Dashboard Utama

1. **Sensor Cards**: Menampilkan data real-time dari sensor
2. **Shallot Avatar**: Animasi karakter yang berubah sesuai kondisi tanaman
3. **Pump Status**: Status pompa irigasi dan sedot dengan animasi
4. **Next Schedule**: Jadwal irigasi berikutnya
5. **Manual Control**: Tombol kontrol manual pompa

### Menambah Jadwal

1. Klik menu **"Jadwal"** (mobile) atau lihat di sidebar (desktop)
2. Klik **"Tambah Jadwal Baru"**
3. Pilih tipe jadwal:
   - **Daily**: Jadwal berulang setiap hari
   - **One-time**: Jadwal satu kali saja
4. Isi nama, waktu, dan durasi
5. Klik **"Simpan"**

### Kontrol Manual

1. Klik tombol **"Kontrol Manual"**
2. Pilih aksi:
   - **Pompa**: Nyalakan pompa irigasi
   - **Sedot**: Nyalakan pompa sedot
   - **Stop**: Matikan semua pompa
   - **Auto**: Mode otomatis
   - **Resume**: Lanjutkan jadwal

## 🔒 Security Notes

- Jangan commit file `.env` ke repository
- Gunakan HTTPS/WSS untuk production
- Enable RLS (Row Level Security) di Supabase
- Gunakan authentication untuk production deployment

## 🐛 Troubleshooting

### MQTT tidak connect

- Cek koneksi internet
- Pastikan broker MQTT dapat diakses
- Cek firewall/antivirus
- Gunakan `ws://` untuk HTTP dan `wss://` untuk HTTPS

### Dashboard tidak update

- Cek browser console untuk error
- Pastikan MQTT broker sama dengan STM32
- Restart development server
- Clear browser cache

### Database error

- Pastikan Supabase credentials benar
- Cek apakah tables sudah dibuat
- Enable RLS dengan policy yang benar

## 📚 Dokumentasi Tambahan

- [MQTT Topics Documentation](MQTT_TOPICS.md)
- [Pump Commands Setup](PUMP_COMMANDS_SETUP.md)
- [Azure IoT Hub Setup](AZURE_IOT_HUB_SETUP.md)
- [Vercel Deployment](VERCEL_DEPLOYMENT.md)

## 🤝 Contributing

Contributions welcome! Silakan buat Pull Request.

## 📄 License

MIT License

## 👨‍💻 Developer

Developed with ❤️ for smart agriculture
