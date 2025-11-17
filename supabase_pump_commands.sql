-- Create pump_commands table to track all pump control commands
CREATE TABLE IF NOT EXISTS pump_commands (
  id BIGSERIAL PRIMARY KEY,
  command TEXT NOT NULL, -- 'POMPA', 'SEDOT', 'STOP', 'AUTO', 'RESUME'
  pump_type TEXT NOT NULL, -- 'irrigation' or 'suction'
  duration_seconds INTEGER, -- Duration if specified
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'manual', -- 'manual', 'api', 'schedule', 'auto'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pump_commands_executed_at ON pump_commands(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pump_commands_pump_type ON pump_commands(pump_type);

-- Enable Row Level Security (optional)
ALTER TABLE pump_commands ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on pump_commands" ON pump_commands
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Example query to get recent commands
-- SELECT * FROM pump_commands ORDER BY executed_at DESC LIMIT 10;

-- Example query to get irrigation pump history
-- SELECT * FROM pump_commands WHERE pump_type = 'irrigation' ORDER BY executed_at DESC LIMIT 10;

-- Example query to get commands from last 24 hours
-- SELECT * FROM pump_commands WHERE executed_at > NOW() - INTERVAL '24 hours' ORDER BY executed_at DESC;
