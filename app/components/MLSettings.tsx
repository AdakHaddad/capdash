// =============================================
// Next.js Dashboard - ML Settings Component
// File: app/components/MLSettings.tsx
// =============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface IrrigationSettings {
  id: string
  ml_mode_enabled: boolean
  ml_confidence_threshold: number
  ml_allowed_start_time: string
  ml_allowed_end_time: string
  ml_min_interval_hours: number
  manual_override_active: boolean
  manual_override_until: string | null
  max_daily_waterings: number
  max_duration_seconds: number
  notify_on_ml_watering: boolean
  notify_on_schedule_watering: boolean
}

export default function MLSettings() {
  const supabase = createClient()
  const [settings, setSettings] = useState<IrrigationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('irrigation_settings')
        .select('*')
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('irrigation_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error
      alert('Settings saved successfully!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Error updating settings:', error)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleManualOverride = async () => {
    if (!settings) return

    const newOverrideState = !settings.manual_override_active
    const overrideUntil = newOverrideState
      ? new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      : null

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('irrigation_settings')
        .update({
          manual_override_active: newOverrideState,
          manual_override_until: overrideUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      setSettings({
        ...settings,
        manual_override_active: newOverrideState,
        manual_override_until: overrideUntil
      })

      alert(newOverrideState 
        ? '🛡️ Manual override enabled for 1 hour. All automated watering paused.' 
        : '✅ Manual override disabled. Automated watering resumed.')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle override';
      console.error('Error toggling manual override:', error)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading settings...</div>
  }

  if (!settings) {
    return <div>No settings found</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        🤖 ML-Powered Auto-Watering Settings
      </h2>

      {/* Manual Override Section */}
      <div className={`p-4 rounded-lg mb-6 ${
        settings.manual_override_active
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400'
          : 'bg-gray-50 dark:bg-gray-700'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              {settings.manual_override_active ? '🛡️ Manual Override Active' : '🤖 Auto-Mode Active'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {settings.manual_override_active
                ? `All automated watering paused until ${settings.manual_override_until ? new Date(settings.manual_override_until).toLocaleString() : 'disabled'}`
                : 'ML predictions and schedules are running normally'}
            </p>
          </div>
          <button
            onClick={toggleManualOverride}
            disabled={isSaving}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              settings.manual_override_active
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            } disabled:opacity-50`}
          >
            {settings.manual_override_active ? 'Resume Auto-Mode' : 'Pause Auto-Mode'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* ML Mode Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h3 className="font-semibold">Enable ML-Powered Watering</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically water based on ML predictions of optimal watering time
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ml_mode_enabled}
              onChange={(e) => setSettings({ ...settings, ml_mode_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-blue-300 
                          dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 
                          peer-checked:after:translate-x-full peer-checked:after:border-white 
                          after:content-[''] after:absolute after:top-0.5 after:left-[4px] 
                          after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all 
                          peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* ML Confidence Threshold */}
        <div>
          <label className="block text-sm font-medium mb-2">
            ML Confidence Threshold: {(settings.ml_confidence_threshold * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={settings.ml_confidence_threshold}
            onChange={(e) => setSettings({ 
              ...settings, 
              ml_confidence_threshold: parseFloat(e.target.value) 
            })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 mt-1">
            Higher threshold = more conservative (only water when ML is very confident)
          </p>
        </div>

        {/* Time Window */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">ML Start Time</label>
            <input
              type="time"
              value={settings.ml_allowed_start_time}
              onChange={(e) => setSettings({ ...settings, ml_allowed_start_time: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ML End Time</label>
            <input
              type="time"
              value={settings.ml_allowed_end_time}
              onChange={(e) => setSettings({ ...settings, ml_allowed_end_time: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          ML auto-watering will only occur within this time window (e.g., avoid watering at night)
        </p>

        {/* Minimum Interval */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Minimum Interval Between ML Waterings: {settings.ml_min_interval_hours} hours
          </label>
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={settings.ml_min_interval_hours}
            onChange={(e) => setSettings({ 
              ...settings, 
              ml_min_interval_hours: parseInt(e.target.value) 
            })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <p className="text-xs text-gray-500 mt-1">
            Prevent too frequent watering by enforcing minimum time between ML-triggered waterings
          </p>
        </div>

        {/* Safety Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Daily Waterings</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_daily_waterings}
              onChange={(e) => setSettings({ 
                ...settings, 
                max_daily_waterings: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Duration (seconds)</label>
            <input
              type="number"
              min="60"
              max="1800"
              step="60"
              value={settings.max_duration_seconds}
              onChange={(e) => setSettings({ 
                ...settings, 
                max_duration_seconds: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm">Notify on ML watering</span>
            <input
              type="checkbox"
              checked={settings.notify_on_ml_watering}
              onChange={(e) => setSettings({ 
                ...settings, 
                notify_on_ml_watering: e.target.checked 
              })}
              className="w-5 h-5 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm">Notify on scheduled watering</span>
            <input
              type="checkbox"
              checked={settings.notify_on_schedule_watering}
              onChange={(e) => setSettings({ 
                ...settings, 
                notify_on_schedule_watering: e.target.checked 
              })}
              className="w-5 h-5 rounded"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={updateSettings}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition duration-200 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : '💾 Save Settings'}
        </button>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            📚 How ML Auto-Watering Works
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>n8n workflow analyzes sensor data and generates ML predictions</li>
            <li>Predictions with confidence above threshold are stored in database</li>
            <li>pg_cron (runs every minute) checks for high-confidence predictions</li>
            <li>If conditions are met (time window, interval, daily limit), watering starts automatically</li>
            <li>STM32 receives MQTT command and executes watering for recommended duration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
