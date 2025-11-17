// =============================================
// Next.js Dashboard - Schedule Manager Component
// File: app/components/ScheduleManager.tsx
// =============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Schedule {
  id: string
  name: string
  enabled: boolean
  schedule_type: string
  time_of_day: string
  days_of_week: number[] | null
  duration_seconds: number
  only_if_soil_below: number | null
  only_if_temp_above: number | null
  last_executed_at: string | null
}

export default function ScheduleManager() {
  const supabase = createClient()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    time_of_day: '06:00',
    duration_seconds: 300,
    days_of_week: [] as number[],
    only_if_soil_below: '',
    only_if_temp_above: '',
  })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const fetchSchedules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('time_of_day', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSchedules()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schedules-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'schedules' },
        () => {
          fetchSchedules()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchSchedules])

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('schedules').insert({
        name: formData.name,
        schedule_type: formData.days_of_week.length > 0 ? 'weekly' : 'daily',
        time_of_day: formData.time_of_day,
        duration_seconds: formData.duration_seconds,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null,
        only_if_soil_below: formData.only_if_soil_below ? parseFloat(formData.only_if_soil_below) : null,
        only_if_temp_above: formData.only_if_temp_above ? parseFloat(formData.only_if_temp_above) : null,
        enabled: true,
        sensor_id: 'sensor_001',
      })

      if (error) throw error

      // Reset form
      setFormData({
        name: '',
        time_of_day: '06:00',
        duration_seconds: 300,
        days_of_week: [],
        only_if_soil_below: '',
        only_if_temp_above: '',
      })
      setShowForm(false)
      alert('Schedule created successfully!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule';
      console.error('Error creating schedule:', error)
      alert(`Error: ${errorMessage}`)
    }
  }

  const toggleSchedule = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ enabled: !currentEnabled })
        .eq('id', id)

      if (error) throw error
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle schedule';
      console.error('Error toggling schedule:', error)
      alert(`Error: ${errorMessage}`)
    }
  }

  const deleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Delete schedule "${name}"?`)) return

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Schedule deleted!')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule';
      console.error('Error deleting schedule:', error)
      alert(`Error: ${errorMessage}`)
    }
  }

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }))
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading schedules...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          📅 Watering Schedules
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg 
                     transition duration-200 flex items-center gap-2"
        >
          {showForm ? '❌ Cancel' : '➕ New Schedule'}
        </button>
      </div>

      {/* Create Schedule Form */}
      {showForm && (
        <form onSubmit={createSchedule} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Schedule Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Morning Watering"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={formData.time_of_day}
                onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
                required
                min="10"
                max="600"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>

            {/* Days of Week */}
            <div>
              <label className="block text-sm font-medium mb-2">Days (leave empty for daily)</label>
              <div className="flex gap-2 flex-wrap">
                {dayNames.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      formData.days_of_week.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional: Soil Moisture */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Only if soil moisture below (%) - optional
              </label>
              <input
                type="number"
                value={formData.only_if_soil_below}
                onChange={(e) => setFormData({ ...formData, only_if_soil_below: e.target.value })}
                placeholder="e.g., 30"
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>

            {/* Conditional: Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Only if temperature above (°C) - optional
              </label>
              <input
                type="number"
                value={formData.only_if_temp_above}
                onChange={(e) => setFormData({ ...formData, only_if_temp_above: e.target.value })}
                placeholder="e.g., 25"
                min="0"
                max="50"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Create Schedule
          </button>
        </form>
      )}

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No schedules yet. Create one to automate watering!
          </p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-lg border ${
                schedule.enabled
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{schedule.name}</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                    <p>⏰ <strong>Time:</strong> {schedule.time_of_day}</p>
                    <p>⏱️ <strong>Duration:</strong> {schedule.duration_seconds}s ({Math.floor(schedule.duration_seconds / 60)}min)</p>
                    {schedule.days_of_week && (
                      <p>📆 <strong>Days:</strong> {schedule.days_of_week.map(d => dayNames[d]).join(', ')}</p>
                    )}
                    {schedule.only_if_soil_below && (
                      <p>💧 <strong>Condition:</strong> Soil moisture {'<'} {schedule.only_if_soil_below}%</p>
                    )}
                    {schedule.last_executed_at && (
                      <p>✅ <strong>Last run:</strong> {new Date(schedule.last_executed_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleSchedule(schedule.id, schedule.enabled)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      schedule.enabled
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {schedule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(schedule.id, schedule.name)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
