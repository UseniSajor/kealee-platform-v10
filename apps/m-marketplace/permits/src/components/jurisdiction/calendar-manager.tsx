'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Button } from '@permits/src/components/ui/button';
import { Input } from '@permits/src/components/ui/input';
import { AlertCircle, Plus, Calendar, Clock } from 'lucide-react';

interface Holiday {
  id?: string;
  name: string;
  date: string;
  recurring: boolean;
  recurringPattern: string;
}

interface ClosurePeriod {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface CalendarManagerProps {
  jurisdictionId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function CalendarManager({ jurisdictionId }: CalendarManagerProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [closures, setClosures] = useState<ClosurePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Holiday>({
    name: '',
    date: '',
    recurring: true,
    recurringPattern: 'YEARLY',
  });
  const [newClosure, setNewClosure] = useState<ClosurePeriod>({
    name: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
        setClosures(data.closurePeriods || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      setError('Holiday name and date are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/holidays`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newHoliday),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add holiday');
      }
      const data = await response.json();
      setHolidays(prev => [...prev, data.holiday]);
      setShowHolidayForm(false);
      setNewHoliday({
        name: '',
        date: '',
        recurring: true,
        recurringPattern: 'YEARLY',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddClosure = async () => {
    if (!newClosure.name || !newClosure.startDate || !newClosure.endDate) {
      setError('Closure name, start date, and end date are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/closure-periods`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newClosure),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add closure period');
      }
      const data = await response.json();
      setClosures(prev => [...prev, data.closurePeriod]);
      setShowClosureForm(false);
      setNewClosure({
        name: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday &amp; Closure Calendar</CardTitle>
        <CardDescription>Manage holidays and closure periods that affect permit processing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Holidays Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Holidays
            </h3>
            <Button onClick={() => setShowHolidayForm(!showHolidayForm)} size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Add Holiday
            </Button>
          </div>

          {showHolidayForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Holiday Name *</label>
                  <Input
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. New Year's Day"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newHoliday.recurring}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, recurring: e.target.checked }))}
                    className="rounded"
                  />
                  Recurring
                </label>
                {newHoliday.recurring && (
                  <select
                    className="px-3 py-1 border rounded-md text-sm"
                    value={newHoliday.recurringPattern}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, recurringPattern: e.target.value }))}
                  >
                    <option value="YEARLY">Yearly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowHolidayForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddHoliday} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Holiday'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-gray-500">No holidays configured.</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((h, idx) => (
                <div key={h.id || idx} className="flex items-center gap-3 p-2 border rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm flex-1">{h.name}</span>
                  <span className="text-xs text-gray-500">{formatDate(h.date)}</span>
                  {h.recurring && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{h.recurringPattern}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Closure Periods Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Closure Periods
            </h3>
            <Button onClick={() => setShowClosureForm(!showClosureForm)} size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Add Closure
            </Button>
          </div>

          {showClosureForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50 mb-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={newClosure.name}
                    onChange={(e) => setNewClosure(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Winter Shutdown"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input
                    type="date"
                    value={newClosure.startDate}
                    onChange={(e) => setNewClosure(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date *</label>
                  <Input
                    type="date"
                    value={newClosure.endDate}
                    onChange={(e) => setNewClosure(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input
                  value={newClosure.reason}
                  onChange={(e) => setNewClosure(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for closure"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowClosureForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddClosure} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Closure'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : closures.length === 0 ? (
            <p className="text-sm text-gray-500">No closure periods configured.</p>
          ) : (
            <div className="space-y-2">
              {closures.map((c, idx) => (
                <div key={c.id || idx} className="flex items-center gap-3 p-2 border rounded-lg">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.reason && <p className="text-xs text-gray-500">{c.reason}</p>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(c.startDate)} - {formatDate(c.endDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
