'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface Props {
  jobId: number;
  contractorId?: number;
  onScheduled?: (date: Date) => void;
  onClose?: () => void;
}

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TimeBlock {
  startDate: string;
  endDate: string;
}

export default function JobScheduler({ jobId, contractorId, onScheduled, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contractorId) {
      fetchContractorCalendar();
    }
  }, [contractorId]);

  const fetchContractorCalendar = async () => {
    if (!contractorId) return;
    try {
      const res = await api.get(`/users/${contractorId}/calendar`);
      setAvailability(res.data.availability || []);
      setTimeBlocks(res.data.timeBlocks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const isDateAvailable = (dateStr: string): boolean => {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Check if contractor works on this day
    const dayAvail = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayAvail || !dayAvail.isActive) return false;

    // Check if date falls within a time block
    for (const block of timeBlocks) {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      if (date >= blockStart && date <= blockEnd) {
        return false;
      }
    }

    return true;
  };

  const handleSchedule = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    // Validate date is available
    if (contractorId && !isDateAvailable(selectedDate)) {
      setError('Contractor is not available on this date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
      await api.post(`/jobs/${jobId}/schedule`, { scheduledDate });
      onScheduled?.(scheduledDate);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error scheduling job');
    } finally {
      setLoading(false);
    }
  };

  // Get available time slots for selected date
  const getTimeSlots = (): string[] => {
    if (!selectedDate || !contractorId) {
      return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    }

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const dayAvail = availability.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayAvail || !dayAvail.isActive) return [];

    const slots: string[] = [];
    const startHour = parseInt(dayAvail.startTime.split(':')[0]);
    const endHour = parseInt(dayAvail.endTime.split(':')[0]);

    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }

    return slots;
  };

  const timeSlots = getTimeSlots();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Schedule Job</CardTitle>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>×</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError('');
              }}
              min={new Date().toISOString().split('T')[0]}
            />
            {selectedDate && contractorId && !isDateAvailable(selectedDate) && (
              <p className="text-sm text-red-500 mt-1">
                Contractor is not available on this date
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Select Time</label>
            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`p-2 rounded border ${
                      selectedTime === slot 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 mt-2">No available time slots</p>
            )}
          </div>

          {contractorId && availability.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Contractor Availability</p>
              <div className="text-sm text-blue-600 mt-1">
                {availability
                  .filter(a => a.isActive)
                  .map(a => {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return `${days[a.dayOfWeek]}: ${a.startTime}-${a.endTime}`;
                  })
                  .join(' | ')}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSchedule} 
            disabled={loading || !selectedDate}
            className="w-full"
          >
            {loading ? 'Scheduling...' : 'Confirm Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

