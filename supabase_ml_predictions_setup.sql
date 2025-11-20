-- =============================================
-- Supabase Table Setup for ML Predictions
-- File: supabase_ml_predictions_setup.sql
-- =============================================
-- Run this SQL in your Supabase SQL Editor

-- Create ml_predictions table to store ML weather predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predicted_at TIMESTAMPTZ NOT NULL,
  weather_in_3_hours TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on ml_predictions" ON ml_predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO ml_predictions (predicted_at, weather_in_3_hours) VALUES
  ('2025-11-20 06:00:55.676128+00', 'kering/berawan'),
  ('2025-11-20 07:00:00.000000+00', 'hujan'),
  ('2025-11-20 08:00:00.000000+00', 'kering/berawan');

-- Example query to get latest prediction
-- SELECT * FROM ml_predictions ORDER BY created_at DESC LIMIT 1;