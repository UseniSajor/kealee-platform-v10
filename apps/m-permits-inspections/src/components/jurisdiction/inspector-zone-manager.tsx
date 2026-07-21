'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, MapPin, User } from 'lucide-react';

interface InspectorAssignment {
  id?: string;
  staffId: string;
  specialty: string;
  zoneId: string;
  maxConcurrentAssignments: number;
  priority: number;
  availableDaysOfWeek: number[];
  availableHoursStart: number;
  availableHoursEnd: number;
}

interface InspectorZoneManagerProps {
  jurisdictionId: string;
}

const SPECIALTIES = [
  'BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE',
  'ACCESSIBILITY', 'ENERGY', 'STRUCTURAL', 'ENVIRONMENTAL', 'GENERAL',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function InspectorZoneManager({ jurisdictionId }: InspectorZoneManagerProps) {
  const [assignments, setAssignments] = useState<InspectorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState<InspectorAssignment>({
    staffId: '',
    specialty: 'GENERAL',
    zoneId: '',
    maxConcurrentAssignments: 5,
    priority: 1,
    availableDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    availableHoursStart: 8,
    availableHoursEnd: 17,
  });

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.inspectorAssignments || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inspector assignments');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const toggleDay = (day: number) => {
    setNewAssignment(prev => {
      const days = prev.availableDaysOfWeek.includes(day)
        ? prev.availableDaysOfWeek.filter(d => d !== day)
        : [...prev.availableDaysOfWeek, day].sort();
      return { ...prev, availableDaysOfWeek: days };
    });
  };

  const handleCreate = async () => {
    if (!newAssignment.staffId) {
      setError('Staff ID is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/inspector-assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...newAssignment,
            zoneId: newAssignment.zoneId || undefined,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create inspector assignment');
      }
      const data = await response.json();
      setAssignments(prev => [...prev, data.assignment]);
      setShowForm(false);
      setNewAssignment({
        staffId: '',
        specialty: 'GENERAL',
        zoneId: '',
        maxConcurrentAssignments: 5,
        priority: 1,
        availableDaysOfWeek: [1, 2, 3, 4, 5],
        availableHoursStart: 8,
        availableHoursEnd: 17,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inspector Zone Management</CardTitle>
            <CardDescription>Assign inspectors to geographic zones and specialties</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Assignment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <h4 className="font-semibold text-sm">New Inspector Assignment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Staff ID *</label>
                <Input
                  value={newAssignment.staffId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, staffId: e.target.value }))}
                  placeholder="Staff member UUID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Specialty *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newAssignment.specialty}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, specialty: e.target.value }))}
                >
                  {SPECIALTIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Zone ID</label>
                <Input
                  value={newAssignment.zoneId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, zoneId: e.target.value }))}
                  placeholder="Optional zone identifier"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Concurrent</label>
                <Input
                  type="number"
                  min={1}
                  value={newAssignment.maxConcurrentAssignments}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, maxConcurrentAssignments: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Input
                  type="number"
                  min={1}
                  value={newAssignment.priority}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Available Days</label>
              <div className="flex gap-2 mt-1">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-2 py-1 text-xs rounded border ${
                      newAssignment.availableDaysOfWeek.includes(idx)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Hours Start</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newAssignment.availableHoursStart}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, availableHoursStart: parseInt(e.target.value) || 8 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hours End</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newAssignment.availableHoursEnd}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, availableHoursEnd: parseInt(e.target.value) || 17 }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading inspector assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No inspector assignments configured. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a, idx) => (
              <div key={a.id || idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.staffId.substring(0, 8)}...</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{a.specialty}</span>
                    {a.zoneId && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.zoneId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.availableDaysOfWeek.map(d => DAYS_OF_WEEK[d]).join(', ')} |
                    {a.availableHoursStart}:00 - {a.availableHoursEnd}:00 |
                    Max {a.maxConcurrentAssignments} concurrent
                  </p>
                </div>
                <span className="text-xs text-gray-500">P{a.priority}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
