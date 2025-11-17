-- =============================================
-- Supabase Table Setup for Sensor Readings
-- File: supabase_setup.sql
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://peykhbxxlgsjclpwhkat.supabase.co

-- 1. Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sensor_id TEXT NOT NULL,
  location TEXT,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  soil_moisture DECIMAL(5,2),
  pump_status TEXT,
  pressure DECIMAL(7,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
  ON sensor_readings(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id 
  ON sensor_readings(sensor_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy: Allow anonymous SELECT (read access)
CREATE POLICY "Allow anonymous read access" 
  ON sensor_readings 
  FOR SELECT 
  USING (true);

-- 5. Create RLS Policy: Allow anonymous INSERT (write access)
CREATE POLICY "Allow anonymous insert access" 
  ON sensor_readings 
  FOR INSERT 
  WITH CHECK (true);

-- 6. Create RLS Policy: Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" 
  ON sensor_readings 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- 7. Insert sample data for testing
INSERT INTO sensor_readings (sensor_id, location, temperature, humidity, soil_moisture, pump_status, pressure)
VALUES 
  ('stm32_d02', 'field_A', 28.5, 65.0, 55.0, 'off', 1013.25),
  ('stm32_d02', 'field_A', 29.0, 63.5, 52.0, 'on', 1013.50),
  ('stm32_d02', 'field_A', 28.8, 64.2, 58.0, 'off', 1013.10),
  ('stm32_d02', 'field_A', 27.5, 66.0, 60.0, 'off', 1012.80),
  ('stm32_d02', 'field_A', 30.2, 62.0, 48.0, 'on', 1014.00);

-- 8. Verify table and policies
SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 5;
