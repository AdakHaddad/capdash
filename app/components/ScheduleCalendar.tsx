
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
  const [formData, setFormData] = useState({
    name: '',
    time_of_day: '06:00',
    duration_seconds: 300,
    days_of_week: [] as number[],
    only_if_soil_below: '',
    only_if_temp_above: '',
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*');

      if (error) throw error;

      const today = moment();
      const startOfWeek = today.clone().startOf('week');

      const scheduleEvents = data.flatMap(schedule => {
        const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
        
        if (schedule.days_of_week && schedule.days_of_week.length > 0) {
          return schedule.days_of_week.map(day => {
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
      console.error('Error fetching schedules:', error);
    }
  };

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setIsEditing(false);
    setFormData({
      name: '',
      time_of_day: moment(start).format('HH:mm'),
      duration_seconds: 300,
      days_of_week: [start.getDay()],
      only_if_soil_below: '',
      only_if_temp_above: '',
    });
    setShowModal(true);
  }, []);

  const handleSelectEvent = (event: ScheduleEvent) => {
    setIsEditing(true);
    setSelectedEvent(event);
    // This is a simplified mapping. You might need to fetch the full schedule from the DB
    setFormData({
      name: event.title || '',
      time_of_day: moment(event.start).format('HH:mm'),
      duration_seconds: event.duration,
      days_of_week: event.start ? [moment(event.start).day()] : [],
      only_if_soil_below: '', // These would need to be fetched
      only_if_temp_above: '', // These would need to be fetched
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const scheduleData = {
        name: formData.name,
        schedule_type: formData.days_of_week.length > 0 ? 'weekly' : 'daily',
        time_of_day: formData.time_of_day,
        duration_seconds: formData.duration_seconds,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null,
        only_if_soil_below: formData.only_if_soil_below ? parseFloat(formData.only_if_soil_below) : null,
        only_if_temp_above: formData.only_if_temp_above ? parseFloat(formData.only_if_temp_above) : null,
        enabled: true,
        sensor_id: 'sensor_001', // You might want to make this dynamic
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
    setShowModal(false);
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
      } catch (error: any) {
        console.error('Error deleting schedule:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  return (
    <div>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 w-[90%] max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Schedule' : 'Create Schedule'}</h2>
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
                  className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
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
                          : 'bg-gray-200'
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
                  className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Save</button>
              {isEditing && (
                <button onClick={handleDelete} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
