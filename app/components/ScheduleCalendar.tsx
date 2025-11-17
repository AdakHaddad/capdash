
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { createClient } from '@/lib/supabase/client';

const localizer = momentLocalizer(moment);

interface ScheduleEvent extends Event {
  id?: string;
  duration: number;
}

export default function ScheduleCalendar() {
  const supabase = createClient();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    time_of_day: '06:00',
    duration_seconds: 300,
    is_repeated: true, // true = daily, false = one-time
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fetchSchedules = useCallback(async () => {
    try {
      setFetchError(null);
      const { data, error } = await supabase
        .from('schedules')
        .select('*');

      if (error) throw error;

      const today = moment();
      const startOfWeek = today.clone().startOf('week');

      const scheduleEvents = data.flatMap(schedule => {
        const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
        
        if (schedule.days_of_week && schedule.days_of_week.length > 0) {
          return schedule.days_of_week.map((day: number) => {
            const eventDate = startOfWeek.clone().add(day, 'days');
            const start = eventDate.clone().hour(hours).minute(minutes).toDate();
            const end = moment(start).add(schedule.duration_seconds, 'seconds').toDate();
            return {
              id: schedule.id,
              title: schedule.name,
              start,
              end,
              duration: schedule.duration_seconds,
            };
          });
        } else {
          // Daily schedule
          return Array.from({ length: 7 }).map((_, i) => {
            const eventDate = startOfWeek.clone().add(i, 'days');
            const start = eventDate.clone().hour(hours).minute(minutes).toDate();
            const end = moment(start).add(schedule.duration_seconds, 'seconds').toDate();
            return {
              id: schedule.id,
              title: schedule.name,
              start,
              end,
              duration: schedule.duration_seconds,
            };
          });
        }
      });

      setEvents(scheduleEvents);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
      console.error('Error fetching schedules:', error);
      setFetchError(message || 'Unknown Supabase error');
      setEvents([]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setIsEditing(false);
    setSelectedDate(start);
    setFormData({
      name: '',
      time_of_day: moment(start).format('HH:mm'),
      duration_seconds: 300,
      is_repeated: true,
    });
    setShowModal(true);
  }, []);

  const handleSelectEvent = (event: ScheduleEvent) => {
    setIsEditing(true);
    setSelectedEvent(event);
    setSelectedDate(event.start || null);
    // This is a simplified mapping. You might need to fetch the full schedule from the DB
    setFormData({
      name: String(event.title || ''),
      time_of_day: moment(event.start).format('HH:mm'),
      duration_seconds: event.duration,
      is_repeated: true, // Default to repeated when editing
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const scheduleData = {
        name: formData.name,
        schedule_type: formData.is_repeated ? 'daily' : 'one-time',
        time_of_day: formData.time_of_day,
        duration_seconds: formData.duration_seconds,
        days_of_week: null,
        specific_date: formData.is_repeated ? null : (selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null),
        only_if_soil_below: null,
        only_if_temp_above: null,
        skip_if_rained: false,
        enabled: true,
        sensor_id: 'sensor_001',
      };

      if (isEditing && selectedEvent?.id) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', selectedEvent.id);
        if (error) throw error;
        alert('Schedule updated successfully!');
      } else {
        const { error } = await supabase.from('schedules').insert(scheduleData);
        if (error) throw error;
        alert('Schedule created successfully!');
      }

      fetchSchedules(); // Refresh the calendar
      setShowModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save schedule';
      console.error('Error saving schedule:', error);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !selectedEvent.id) return;

    if (confirm(`Delete schedule "${selectedEvent.title}"?`)) {
      try {
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', selectedEvent.id);

        if (error) throw error;

        alert('Schedule deleted!');
        fetchSchedules(); // Refresh the calendar
        setShowModal(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule';
        console.error('Error deleting schedule:', error);
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  return (
    <div>
      {fetchError && (
        <div className="mb-4 rounded bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          Unable to fetch schedules from Supabase: {fetchError}
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {isEditing ? 'Edit Schedule' : 'Create Schedule'}
            </h2>
            
            {/* Date Label for UX */}
            {selectedDate && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{formData.is_repeated ? '�' : '�📅'}</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      {formData.is_repeated ? 'Starting from:' : 'Scheduling for:'}
                    </p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                    </p>
                    {formData.is_repeated && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        ⚡ Will run every day at {formData.time_of_day}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {fetchError && (
              <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                Failed to load schedules: {fetchError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schedule Type Toggle */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Schedule Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_repeated: true })}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      formData.is_repeated
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🔄</span>
                      <div className="text-left">
                        <div className="font-bold">Repeated Daily</div>
                        <div className="text-xs opacity-90">Run every day at this time</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_repeated: false })}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      !formData.is_repeated
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">📅</span>
                      <div className="text-left">
                        <div className="font-bold">One-Time</div>
                        <div className="text-xs opacity-90">Run once on selected date</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Morning Watering"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time_of_day}
                  onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  required
                  min="10"
                  max="3600"
                  placeholder="e.g., 300 (5 minutes)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How long to run the pump (10-3600 seconds)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              {isEditing && (
                <button 
                  type="button"
                  onClick={handleDelete} 
                  className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
