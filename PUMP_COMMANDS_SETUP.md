# Pump Commands Database Setup

## Overview
This setup tracks all pump control commands in the database for monitoring and audit purposes.

## Database Setup

1. **Run the SQL script in Supabase SQL Editor:**
   ```bash
   # Copy content from supabase_pump_commands.sql
   # Paste into Supabase Dashboard > SQL Editor > New query
   # Click "Run" to create the table
   ```

2. **Table Structure:**
   ```sql
   pump_commands (
     id              BIGSERIAL PRIMARY KEY,
     command         TEXT NOT NULL,        -- 'POMPA', 'SEDOT', 'STOP', etc.
     pump_type       TEXT NOT NULL,        -- 'irrigation' or 'suction'
     duration_seconds INTEGER,             -- Duration if specified
     executed_at     TIMESTAMPTZ NOT NULL, -- When command was sent
     source          TEXT DEFAULT 'manual',-- 'manual', 'api', 'schedule', 'auto'
     created_at      TIMESTAMPTZ DEFAULT NOW()
   )
   ```

## Features

### ✅ Command Logging
- **All pump commands are saved** to the database
- Tracks command type, pump type, duration, timestamp, and source
- Works for both MQTT and API-based commands

### ✅ Multiple Sources
- `manual` - User clicked button in UI
- `api` - Command via API route
- `schedule` - Triggered by schedule (future feature)
- `auto` - Triggered by AI/automation (future feature)

### ✅ Query Examples

**Recent commands:**
```sql
SELECT * FROM pump_commands 
ORDER BY executed_at DESC 
LIMIT 10;
```

**Irrigation pump history:**
```sql
SELECT * FROM pump_commands 
WHERE pump_type = 'irrigation' 
ORDER BY executed_at DESC 
LIMIT 10;
```

**Last 24 hours:**
```sql
SELECT * FROM pump_commands 
WHERE executed_at > NOW() - INTERVAL '24 hours' 
ORDER BY executed_at DESC;
```

**Daily usage statistics:**
```sql
SELECT 
  DATE(executed_at) as date,
  pump_type,
  COUNT(*) as total_commands,
  SUM(duration_seconds) as total_duration_seconds
FROM pump_commands 
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(executed_at), pump_type
ORDER BY date DESC;
```

## Code Updates

### 1. API Route (`app/api/pump/route.ts`)
- ✅ Imports Supabase client
- ✅ Saves command to `pump_commands` table after MQTT publish
- ✅ Logs success/failure to console

### 2. Frontend (`app/page.tsx`)
- ✅ `controlPump()` function saves command to DB
- ✅ Works for both MQTT and API-based control
- ✅ Shows confirmation in logs

## Testing

1. **Create the table in Supabase:**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run `supabase_pump_commands.sql`

2. **Test pump control:**
   - Click "Kontrol Manual" button
   - Click "Pompa" or "Sedot"
   - Check console for "✅ Command saved to database"

3. **Verify in database:**
   ```sql
   SELECT * FROM pump_commands ORDER BY executed_at DESC LIMIT 5;
   ```

## Benefits

1. **Audit Trail** - Track all pump operations
2. **Usage Statistics** - Analyze irrigation patterns
3. **Debugging** - See command history when troubleshooting
4. **Compliance** - Maintain records for agricultural reporting
5. **Analytics** - Build dashboards showing pump usage over time

## Future Enhancements

- [ ] Add user_id to track which user sent command
- [ ] Add status field to track if command succeeded
- [ ] Link to schedule_id for automated commands
- [ ] Add notes/reason field for manual commands
- [ ] Create real-time subscription for command monitoring
- [ ] Build analytics dashboard showing pump usage patterns
