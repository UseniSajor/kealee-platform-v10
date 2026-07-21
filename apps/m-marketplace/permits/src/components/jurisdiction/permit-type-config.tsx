'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Button } from '@permits/src/components/ui/button';
import { Input } from '@permits/src/components/ui/input';
import { AlertCircle, Plus, Settings } from 'lucide-react';

interface PermitTypeConfigData {
  id?: string;
  permitType: string;
  displayName: string;
  description: string;
  requiresArchitect: boolean;
  requiresEngineer: boolean;
  requiresContractor: boolean;
  requiresOwnerSignature: boolean;
  requiredDocuments: string[];
  autoApprovalThreshold: number | null;
}

interface PermitTypeConfigProps {
  jurisdictionId: string;
}

const PERMIT_TYPES = [
  'BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE',
  'GRADING', 'DEMOLITION', 'SIGN', 'FENCE', 'ROOFING',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function PermitTypeConfig({ jurisdictionId }: PermitTypeConfigProps) {
  const [configs, setConfigs] = useState<PermitTypeConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newConfig, setNewConfig] = useState<PermitTypeConfigData>({
    permitType: 'BUILDING',
    displayName: '',
    description: '',
    requiresArchitect: false,
    requiresEngineer: false,
    requiresContractor: true,
    requiresOwnerSignature: false,
    requiredDocuments: [],
    autoApprovalThreshold: null,
  });
  const [newDocument, setNewDocument] = useState('');

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.permitTypeConfigs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load permit type configs');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setNewConfig(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, newDocument.trim()],
      }));
      setNewDocument('');
    }
  };

  const handleRemoveDocument = (idx: number) => {
    setNewConfig(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== idx),
    }));
  };

  const handleCreate = async () => {
    if (!newConfig.displayName || !newConfig.permitType) {
      setError('Permit type and display name are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/permit-type-configs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...newConfig,
            autoApprovalThreshold: newConfig.autoApprovalThreshold || undefined,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create permit type config');
      }
      const data = await response.json();
      setConfigs(prev => [...prev, data.config]);
      setShowForm(false);
      setNewConfig({
        permitType: 'BUILDING',
        displayName: '',
        description: '',
        requiresArchitect: false,
        requiresEngineer: false,
        requiresContractor: true,
        requiresOwnerSignature: false,
        requiredDocuments: [],
        autoApprovalThreshold: null,
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
            <CardTitle>Permit Type Configuration</CardTitle>
            <CardDescription>Configure permit types and their requirements</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Permit Type
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
            <h4 className="font-semibold text-sm">New Permit Type Config</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Permit Type *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newConfig.permitType}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, permitType: e.target.value }))}
                >
                  {PERMIT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Display Name *</label>
                <Input
                  value={newConfig.displayName}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g. Building Permit"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newConfig.description}
                onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this permit type"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Auto-Approval Threshold ($)</label>
                <Input
                  type="number"
                  min={0}
                  value={newConfig.autoApprovalThreshold ?? ''}
                  onChange={(e) => setNewConfig(prev => ({
                    ...prev,
                    autoApprovalThreshold: e.target.value ? parseFloat(e.target.value) : null,
                  }))}
                  placeholder="Leave empty for no auto-approval"
                />
              </div>
              <div className="flex flex-col gap-1 pt-5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newConfig.requiresArchitect}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, requiresArchitect: e.target.checked }))}
                    className="rounded" />
                  Requires Architect
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newConfig.requiresEngineer}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, requiresEngineer: e.target.checked }))}
                    className="rounded" />
                  Requires Engineer
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newConfig.requiresContractor}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, requiresContractor: e.target.checked }))}
                    className="rounded" />
                  Requires Contractor
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newConfig.requiresOwnerSignature}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, requiresOwnerSignature: e.target.checked }))}
                    className="rounded" />
                  Requires Owner Signature
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Required Documents</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="e.g. Site Plan, Floor Plan"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDocument())}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddDocument}>Add</Button>
              </div>
              {newConfig.requiredDocuments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {newConfig.requiredDocuments.map((doc, idx) => (
                    <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                      {doc}
                      <button onClick={() => handleRemoveDocument(idx)} className="hover:text-red-500">x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Config'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading permit type configurations...</p>
        ) : configs.length === 0 ? (
          <p className="text-sm text-gray-500">No permit types configured. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {configs.map((c, idx) => (
              <div key={c.id || idx} className="flex items-center gap-3 p-3 border rounded-lg">
                <Settings className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.displayName}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c.permitType}</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {c.requiresArchitect && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Architect</span>}
                    {c.requiresEngineer && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Engineer</span>}
                    {c.requiresContractor && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Contractor</span>}
                    {c.autoApprovalThreshold && (
                      <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                        Auto-approve &lt;${c.autoApprovalThreshold.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{c.requiredDocuments?.length || 0} docs</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
