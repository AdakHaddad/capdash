// =============================================
// Next.js Dashboard - Sensor History Component
// File: app/components/SensorHistory.tsx
// =============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SensorReading {
  id: string
  timestamp: string
  sensor_id: string
  location: string
  temperature: number
  humidity: number
  soil_moisture: number
  pump_status: string
  pressure: number
  created_at: string
}

export default function SensorHistory() {
  const supabase = createClient()
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [useDemoData, setUseDemoData] = useState(false)

  const loadDemoData = () => {
    setLoading(true)
    // Generate demo data
    const now = new Date()
    const demoReadings: SensorReading[] = []
    
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000) // Every 30 minutes
      demoReadings.push({
        id: `demo-${i}`,
        timestamp: timestamp.toISOString(),
        sensor_id: 'stm32_d02',
        location: 'field_A',
        temperature: 25 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        soil_moisture: 40 + Math.random() * 30,
        pump_status: Math.random() > 0.7 ? 'on' : 'off',
        pressure: 1010 + Math.random() * 20,
        created_at: timestamp.toISOString()
      })
    }
    
    setReadings(demoReadings.reverse())
    setError(null)
    setLoading(false)
  }

  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate time range
      const now = new Date()
      const hoursAgo = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168
      }[timeRange]

      const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

      const { data, error: fetchError } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true })
        .limit(100)

      if (fetchError) {
        console.error('Supabase error details:', fetchError)
        throw new Error(fetchError.message || fetchError.hint || 'Database query failed')
      }

      setReadings(data || [])
    } catch (err: unknown) {
      console.error('Error fetching sensor readings:', err)
      const errorMessage = err instanceof Error ? err.message :
        (typeof err === 'object' && err !== null && Object.keys(err).length === 0 
          ? 'Unable to connect to database. Please check Supabase configuration.' 
          : 'Failed to load sensor history')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [supabase, timeRange])

  useEffect(() => {
    if (!useDemoData) {
      fetchReadings()
    } else {
      loadDemoData()
    }
  }, [timeRange, useDemoData, fetchReadings])

  // Calculate min/max for graph scaling
  const getMinMax = (values: number[]) => {
    const filtered = values.filter(v => v > 0)
    if (filtered.length === 0) return { min: 0, max: 100 }
    return {
      min: Math.floor(Math.min(...filtered) * 0.9),
      max: Math.ceil(Math.max(...filtered) * 1.1)
    }
  }

  // Simple line graph component
  const LineGraph = ({ data, label, color, unit }: { 
    data: number[], 
    label: string, 
    color: string,
    unit: string 
  }) => {
    const { min, max } = getMinMax(data)
    const range = max - min || 1

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <span className="text-xs text-gray-500">
            {data.length > 0 ? `${data[data.length - 1].toFixed(1)}${unit}` : 'N/A'}
          </span>
        </div>
        <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden">
          {data.length > 0 ? (
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 100
                  const y = 100 - ((value - min) / range) * 100
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-400">
              No data
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min.toFixed(0)}{unit}</span>
          <span>{max.toFixed(0)}{unit}</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        {/* Error Banner with Demo Data Option */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">⚠️ Database Connection Issue</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUseDemoData(true)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition-colors"
              >
                Show Demo Data
              </button>
              <button 
                onClick={fetchReadings}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        
        {/* Troubleshooting Tips */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">💡 Troubleshooting:</p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Check if <code className="px-1 bg-blue-100 dark:bg-blue-800 rounded">sensor_readings</code> table exists in Supabase</li>
            <li>Verify RLS policies allow SELECT for anonymous users</li>
            <li>Confirm Supabase credentials in .env.local</li>
          </ul>
        </div>
      </div>
    )
  }

  // Extract data series
  const temperatures = readings.map(r => r.temperature)
  const humidities = readings.map(r => r.humidity)
  const soilMoistures = readings.map(r => r.soil_moisture)
  const pressures = readings.map(r => r.pressure)

  return (
    <div className="space-y-4">
      {/* Demo Mode Banner */}
      {useDemoData && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📊 <strong>Demo Mode:</strong> Showing sample data. Configure Supabase to see real sensor readings.
            </p>
            <button
              onClick={() => {
                setUseDemoData(false)
                fetchReadings()
              }}
              className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['1h', '6h', '24h', '7d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range === '1h' && '1 Jam'}
            {range === '6h' && '6 Jam'}
            {range === '24h' && '24 Jam'}
            {range === '7d' && '7 Hari'}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium">Total Data</div>
          <div className="text-2xl font-bold text-blue-900">{readings.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium">Pump Active</div>
          <div className="text-2xl font-bold text-green-900">
            {readings.filter(r => r.pump_status === 'on').length}
          </div>
        </div>
      </div>

      {/* Graphs */}
      {readings.length > 0 ? (
        <>
          <LineGraph 
            data={temperatures} 
            label="🌡️ Temperature" 
            color="#EF4444" 
            unit="°C"
          />
          <LineGraph 
            data={humidities} 
            label="💧 Humidity" 
            color="#3B82F6" 
            unit="%"
          />
          <LineGraph 
            data={soilMoistures} 
            label="🌱 Soil Moisture" 
            color="#10B981" 
            unit="%"
          />
          <LineGraph 
            data={pressures} 
            label="🌀 Pressure" 
            color="#8B5CF6" 
            unit="hPa"
          />
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">📊 No sensor data available</p>
          <p className="text-xs mt-1">Data will appear here once sensors start reporting</p>
        </div>
      )}

      {/* Recent Readings Table */}
      {readings.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Readings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Time</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Temp</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Humid</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Soil</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600">Pump</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(-10).reverse().map((reading) => (
                  <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-600">
                      {new Date(reading.timestamp).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      {reading.temperature.toFixed(1)}°
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      {reading.humidity.toFixed(0)}%
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      {reading.soil_moisture.toFixed(0)}%
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        reading.pump_status === 'on' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {reading.pump_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
