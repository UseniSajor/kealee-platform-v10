'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';

interface ReviewDiscipline {
  id?: string;
  disciplineType: string;
  displayName: string;
  description: string;
  isRequired: boolean;
  reviewOrder: number;
  estimatedReviewDays: number;
  autoAssign: boolean;
}

interface ReviewDisciplineConfigProps {
  jurisdictionId: string;
}

const DISCIPLINE_TYPES = [
  'ZONING', 'BUILDING', 'FIRE', 'ENVIRONMENTAL', 'STRUCTURAL',
  'MECHANICAL', 'ELECTRICAL', 'PLUMBING', 'ACCESSIBILITY', 'ENERGY',
  'LANDSCAPE', 'HISTORIC',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function ReviewDisciplineConfig({ jurisdictionId }: ReviewDisciplineConfigProps) {
  const [disciplines, setDisciplines] = useState<ReviewDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState<ReviewDiscipline>({
    disciplineType: 'BUILDING',
    displayName: '',
    description: '',
    isRequired: false,
    reviewOrder: 1,
    estimatedReviewDays: 5,
    autoAssign: false,
  });

  const loadDisciplines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setDisciplines(data.reviewDisciplines || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review disciplines');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  const handleCreate = async () => {
    if (!newDiscipline.displayName) {
      setError('Display name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/review-disciplines`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newDiscipline),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create review discipline');
      }
      const data = await response.json();
      setDisciplines(prev => [...prev, data.discipline]);
      setShowForm(false);
      setNewDiscipline({
        disciplineType: 'BUILDING',
        displayName: '',
        description: '',
        isRequired: false,
        reviewOrder: disciplines.length + 2,
        estimatedReviewDays: 5,
        autoAssign: false,
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
            <CardTitle>Review Discipline Setup</CardTitle>
            <CardDescription>Configure review disciplines for permit applications</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Discipline
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
            <h4 className="font-semibold text-sm">New Review Discipline</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Discipline Type *</label>
                <Select
                  value={newDiscipline.disciplineType}
                  onValueChange={(v) => setNewDiscipline(prev => ({ ...prev, disciplineType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISCIPLINE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Display Name *</label>
                <Input
                  value={newDiscipline.displayName}
                  onChange={(e) => setNewDiscipline(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g. Building Code Review"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newDiscipline.description}
                onChange={(e) => setNewDiscipline(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this review discipline"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Review Order</label>
                <Input
                  type="number"
                  min={1}
                  value={newDiscipline.reviewOrder}
                  onChange={(e) => setNewDiscipline(prev => ({ ...prev, reviewOrder: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Days</label>
                <Input
                  type="number"
                  min={1}
                  value={newDiscipline.estimatedReviewDays}
                  onChange={(e) => setNewDiscipline(prev => ({ ...prev, estimatedReviewDays: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newDiscipline.isRequired}
                    onChange={(e) => setNewDiscipline(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="rounded"
                  />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newDiscipline.autoAssign}
                    onChange={(e) => setNewDiscipline(prev => ({ ...prev, autoAssign: e.target.checked }))}
                    className="rounded"
                  />
                  Auto-assign
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Discipline'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading review disciplines...</p>
        ) : disciplines.length === 0 ? (
          <p className="text-sm text-gray-500">No review disciplines configured. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {disciplines.map((d, idx) => (
              <div key={d.id || idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.displayName}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{d.disciplineType}</span>
                    {d.isRequired && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Required</span>
                    )}
                    {d.autoAssign && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Auto-assign</span>
                    )}
                  </div>
                  {d.description && <p className="text-xs text-gray-500 mt-1">{d.description}</p>}
                </div>
                <span className="text-xs text-gray-500">{d.estimatedReviewDays}d</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
