// =============================================
// Next.js Dashboard - Manual Pump Control Component
// File: app/components/ManualControl.tsx
// =============================================

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManualControl() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [duration, setDuration] = useState(300) // Default 5 minutes
  const [lastCommand, setLastCommand] = useState<{
    command: string
    duration_seconds?: number
    status?: string
    issued_at?: string
    timestamp?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sendPumpCommand = async (command: 'START' | 'STOP') => {
    setIsLoading(true)
    setError(null)

    try {
      // Send command via serverless API (publishes to MQTT)
      const response = await fetch('/api/pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          duration_seconds: command === 'START' ? duration : 0,
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to send command')
      }

      // Also log to Supabase for history
      const { data } = await supabase
        .from('pump_commands')
        .insert({
          command,
          duration_seconds: command === 'START' ? duration : 0,
          status: 'sent',
          triggered_by: 'manual',
          issued_at: new Date().toISOString()
        })
        .select()
        .single()

      setLastCommand(data || result)
      
      // Show success message
      alert(`Pump ${command} command sent successfully via MQTT!`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send pump command';
      console.error('Error sending pump command:', err)
      setError(errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        🎮 Manual Pump Control
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Control the irrigation pump directly. Commands are sent via MQTT to your STM32 device.
      </p>

      {/* Duration Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Watering Duration (seconds)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value) || 300)}
          min="10"
          max="600"
          step="30"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {Math.floor(duration / 60)} minutes {duration % 60} seconds
        </p>
      </div>

      {/* Quick Duration Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setDuration(60)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          1 min
        </button>
        <button
          onClick={() => setDuration(180)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          3 min
        </button>
        <button
          onClick={() => setDuration(300)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          5 min
        </button>
        <button
          onClick={() => setDuration(600)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          10 min
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => sendPumpCommand('START')}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                     text-white font-bold py-4 px-6 rounded-lg 
                     transition duration-200 ease-in-out transform hover:scale-105
                     disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <span>💧</span>
          )}
          START PUMP
        </button>

        <button
          onClick={() => sendPumpCommand('STOP')}
          disabled={isLoading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 
                     text-white font-bold py-4 px-6 rounded-lg 
                     transition duration-200 ease-in-out transform hover:scale-105
                     disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <span>🛑</span>
          )}
          STOP PUMP
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">
            ❌ {error}
          </p>
        </div>
      )}

      {/* Last Command Info */}
      {lastCommand && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Last Command
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <p><strong>Command:</strong> {lastCommand.command}</p>
            {lastCommand.duration_seconds !== undefined && (
              <p><strong>Duration:</strong> {lastCommand.duration_seconds}s</p>
            )}
            {lastCommand.status && (
              <p><strong>Status:</strong> {lastCommand.status}</p>
            )}
            {(lastCommand.issued_at || lastCommand.timestamp) && (
              <p><strong>Issued:</strong> {new Date(lastCommand.issued_at || lastCommand.timestamp || '').toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Safety Info */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-300 text-sm">
          ⚠️ <strong>Safety Note:</strong> Manual commands override scheduled and ML-based watering. 
          The pump will automatically stop after the specified duration.
        </p>
      </div>
    </div>
  )
}
