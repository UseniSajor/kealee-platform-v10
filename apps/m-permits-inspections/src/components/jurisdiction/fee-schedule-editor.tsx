'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, DollarSign } from 'lucide-react';

interface FeeScheduleData {
  id?: string;
  feeName: string;
  permitType: string;
  description: string;
  calculationMethod: string;
  baseAmount: number | null;
  percentage: number | null;
  perSquareFoot: number | null;
  minAmount: number | null;
  maxAmount: number | null;
}

interface FeeScheduleEditorProps {
  jurisdictionId: string;
}

const CALCULATION_METHODS = [
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage of Valuation' },
  { value: 'PER_SQUARE_FOOT', label: 'Per Square Foot' },
  { value: 'PER_UNIT', label: 'Per Unit' },
  { value: 'FORMULA', label: 'Custom Formula' },
  { value: 'TIERED', label: 'Tiered' },
];

const PERMIT_TYPES = [
  'BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE',
  'GRADING', 'DEMOLITION', 'SIGN', 'FENCE', 'ROOFING',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function FeeScheduleEditor({ jurisdictionId }: FeeScheduleEditorProps) {
  const [fees, setFees] = useState<FeeScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newFee, setNewFee] = useState<FeeScheduleData>({
    feeName: '',
    permitType: 'BUILDING',
    description: '',
    calculationMethod: 'FIXED',
    baseAmount: null,
    percentage: null,
    perSquareFoot: null,
    minAmount: null,
    maxAmount: null,
  });

  const loadFees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setFees(data.feeSchedules || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load fee schedules');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handleCreate = async () => {
    if (!newFee.feeName || !newFee.permitType) {
      setError('Fee name and permit type are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        feeName: newFee.feeName,
        permitType: newFee.permitType,
        description: newFee.description || undefined,
        calculationMethod: newFee.calculationMethod,
      };
      if (newFee.baseAmount) payload.baseAmount = newFee.baseAmount;
      if (newFee.percentage) payload.percentage = newFee.percentage;
      if (newFee.perSquareFoot) payload.perSquareFoot = newFee.perSquareFoot;
      if (newFee.minAmount) payload.minAmount = newFee.minAmount;
      if (newFee.maxAmount) payload.maxAmount = newFee.maxAmount;

      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/fee-schedules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create fee schedule');
      }
      const data = await response.json();
      setFees(prev => [...prev, data.feeSchedule]);
      setShowForm(false);
      setNewFee({
        feeName: '',
        permitType: 'BUILDING',
        description: '',
        calculationMethod: 'FIXED',
        baseAmount: null,
        percentage: null,
        perSquareFoot: null,
        minAmount: null,
        maxAmount: null,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatFeeAmount = (fee: FeeScheduleData): string => {
    switch (fee.calculationMethod) {
      case 'FIXED':
        return `$${(fee.baseAmount || 0).toLocaleString()}`;
      case 'PERCENTAGE':
        return `${fee.percentage || 0}% of valuation`;
      case 'PER_SQUARE_FOOT':
        return `$${fee.perSquareFoot || 0}/sqft`;
      case 'PER_UNIT':
        return `$${fee.baseAmount || 0}/unit`;
      default:
        return fee.calculationMethod;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fee Schedule Editor</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Fee
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
            <h4 className="font-semibold text-sm">New Fee Schedule</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Fee Name *</label>
                <Input
                  value={newFee.feeName}
                  onChange={(e) => setNewFee(prev => ({ ...prev, feeName: e.target.value }))}
                  placeholder="e.g. Building Permit Fee"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Permit Type *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newFee.permitType}
                  onChange={(e) => setNewFee(prev => ({ ...prev, permitType: e.target.value }))}
                >
                  {PERMIT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newFee.description}
                onChange={(e) => setNewFee(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this fee"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Calculation Method *</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={newFee.calculationMethod}
                onChange={(e) => setNewFee(prev => ({ ...prev, calculationMethod: e.target.value }))}
              >
                {CALCULATION_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(newFee.calculationMethod === 'FIXED' || newFee.calculationMethod === 'PER_UNIT') && (
                <div>
                  <label className="text-sm font-medium">Base Amount ($)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newFee.baseAmount ?? ''}
                    onChange={(e) => setNewFee(prev => ({ ...prev, baseAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="0.00"
                  />
                </div>
              )}
              {newFee.calculationMethod === 'PERCENTAGE' && (
                <div>
                  <label className="text-sm font-medium">Percentage (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={newFee.percentage ?? ''}
                    onChange={(e) => setNewFee(prev => ({ ...prev, percentage: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="0.00"
                  />
                </div>
              )}
              {newFee.calculationMethod === 'PER_SQUARE_FOOT' && (
                <div>
                  <label className="text-sm font-medium">Per Square Foot ($)</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newFee.perSquareFoot ?? ''}
                    onChange={(e) => setNewFee(prev => ({ ...prev, perSquareFoot: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Min Amount ($)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newFee.minAmount ?? ''}
                  onChange={(e) => setNewFee(prev => ({ ...prev, minAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Amount ($)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newFee.maxAmount ?? ''}
                  onChange={(e) => setNewFee(prev => ({ ...prev, maxAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Fee'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading fee schedules...</p>
        ) : fees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee schedules configured. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {fees.map((f, idx) => (
              <div key={f.id || idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{f.feeName}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{f.permitType}</span>
                  </div>
                  {f.description && <p className="text-xs text-gray-500 mt-1">{f.description}</p>}
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatFeeAmount(f)}</span>
                  <span className="text-xs text-gray-500 block">
                    {CALCULATION_METHODS.find(m => m.value === f.calculationMethod)?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
