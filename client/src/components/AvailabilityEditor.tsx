'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Props {
  userId: number;
  onSave?: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SCHEDULE: Availability[] = DAYS.map((_, idx) => ({
  dayOfWeek: idx,
  startTime: '09:00',
  endTime: '17:00',
  isActive: idx >= 1 && idx <= 5 // Mon-Fri active by default
}));

export default function AvailabilityEditor({ userId, onSave }: Props) {
  const [schedule, setSchedule] = useState<Availability[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [userId]);

  const fetchAvailability = async () => {
    try {
      const res = await api.get(`/users/${userId}/availability`);
      if (res.data && res.data.length > 0) {
        // Merge with defaults to ensure all days are present
        const merged = DEFAULT_SCHEDULE.map(def => {
          const existing = res.data.find((a: Availability) => a.dayOfWeek === def.dayOfWeek);
          return existing || def;
        });
        setSchedule(merged);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule(prev => prev.map(s => 
      s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => prev.map(s =>
      s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${userId}/availability`, { schedule });
      onSave?.();
      alert('Availability saved!');
    } catch (err) {
      alert('Error saving availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading availability...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((day) => (
            <div key={day.dayOfWeek} className="flex items-center gap-4 py-2 border-b last:border-0">
              <div className="w-28">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={() => handleToggleDay(day.dayOfWeek)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className={day.isActive ? 'font-medium' : 'text-slate-400'}>
                    {DAYS[day.dayOfWeek]}
                  </span>
                </label>
              </div>
              
              {day.isActive && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-slate-500">to</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
              
              {!day.isActive && (
                <span className="text-slate-400 italic">Not working</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

