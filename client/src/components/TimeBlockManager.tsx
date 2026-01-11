'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface TimeBlock {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
}

interface Props {
  userId: number;
  onUpdate?: () => void;
}

const REASONS = [
  { value: 'HOLIDAY', label: 'Holiday / Vacation' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'APPOINTMENT', label: 'Appointment' },
  { value: 'OTHER', label: 'Other' }
];

export default function TimeBlockManager({ userId, onUpdate }: Props) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: 'HOLIDAY',
    notes: ''
  });

  useEffect(() => {
    fetchTimeBlocks();
  }, [userId]);

  const fetchTimeBlocks = async () => {
    try {
      const res = await api.get(`/users/${userId}/timeblocks`);
      setTimeBlocks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/users/${userId}/timeblocks`, formData);
      setShowForm(false);
      setFormData({ startDate: '', endDate: '', reason: 'HOLIDAY', notes: '' });
      fetchTimeBlocks();
      onUpdate?.();
    } catch (err) {
      alert('Error adding time block');
    }
  };

  const handleDelete = async (blockId: number) => {
    if (!confirm('Are you sure you want to delete this time block?')) return;
    try {
      await api.delete(`/users/timeblocks/${blockId}`);
      fetchTimeBlocks();
      onUpdate?.();
    } catch (err) {
      alert('Error deleting time block');
    }
  };

  if (loading) {
    return <div className="p-4">Loading time blocks...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Time Off / Blocked Dates</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'default'}>
            {showForm ? 'Cancel' : '+ Add Block'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              >
                {REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                placeholder="Any additional details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">Add Time Block</Button>
          </form>
        )}

        {timeBlocks.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No blocked times scheduled</p>
        ) : (
          <div className="space-y-3">
            {timeBlocks.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                      block.reason === 'HOLIDAY' ? 'bg-blue-100 text-blue-800' :
                      block.reason === 'SICK' ? 'bg-red-100 text-red-800' :
                      block.reason === 'APPOINTMENT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {REASONS.find(r => r.value === block.reason)?.label || block.reason}
                    </span>
                  </div>
                  <p className="font-medium mt-1">
                    {new Date(block.startDate).toLocaleDateString()} - {new Date(block.endDate).toLocaleDateString()}
                  </p>
                  {block.notes && (
                    <p className="text-sm text-slate-600">{block.notes}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => handleDelete(block.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

