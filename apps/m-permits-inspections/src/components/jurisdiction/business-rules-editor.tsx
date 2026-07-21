'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Plus, Zap } from 'lucide-react';

interface BusinessRule {
  id?: string;
  name: string;
  description: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  action: string;
  priority: number;
  enabled: boolean;
}

interface BusinessRulesEditorProps {
  jurisdictionId: string;
}

const CONDITION_FIELDS = [
  { value: 'permitType', label: 'Permit Type' },
  { value: 'valuation', label: 'Project Valuation' },
  { value: 'squareFootage', label: 'Square Footage' },
  { value: 'expedited', label: 'Expedited Request' },
  { value: 'occupancyType', label: 'Occupancy Type' },
  { value: 'constructionType', label: 'Construction Type' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { value: 'contains', label: 'Contains' },
];

const ACTIONS = [
  { value: 'AUTO_APPROVE', label: 'Auto-Approve', color: 'bg-green-100 text-green-700' },
  { value: 'EXPEDITE', label: 'Expedite', color: 'bg-blue-100 text-blue-700' },
  { value: 'REQUIRE_REVIEW', label: 'Require Review', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'NOTIFY', label: 'Send Notification', color: 'bg-purple-100 text-purple-700' },
  { value: 'REJECT', label: 'Auto-Reject', color: 'bg-red-100 text-red-700' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function BusinessRulesEditor({ jurisdictionId }: BusinessRulesEditorProps) {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState<BusinessRule>({
    name: '',
    description: '',
    conditionField: 'valuation',
    conditionOperator: 'lessThan',
    conditionValue: '',
    action: 'AUTO_APPROVE',
    priority: 1,
    enabled: true,
  });

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/configuration`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setRules(data.businessRules || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business rules');
    } finally {
      setLoading(false);
    }
  }, [jurisdictionId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreate = async () => {
    if (!newRule.name || !newRule.conditionValue) {
      setError('Rule name and condition value are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Build the condition JSON in the format the backend expects
      const condition = JSON.stringify({
        field: newRule.conditionField,
        operator: newRule.conditionOperator,
        value: isNaN(Number(newRule.conditionValue))
          ? newRule.conditionValue
          : Number(newRule.conditionValue),
      });

      const response = await fetch(
        `${API_URL}/permits/jurisdictions/${jurisdictionId}/business-rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: newRule.name,
            description: newRule.description || undefined,
            condition,
            action: newRule.action,
            priority: newRule.priority,
            enabled: newRule.enabled,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create business rule');
      }
      const data = await response.json();
      setRules(prev => [...prev, {
        ...data.rule,
        // Parse the condition back for display
        conditionField: newRule.conditionField,
        conditionOperator: newRule.conditionOperator,
        conditionValue: newRule.conditionValue,
      }]);
      setShowForm(false);
      setNewRule({
        name: '',
        description: '',
        conditionField: 'valuation',
        conditionOperator: 'lessThan',
        conditionValue: '',
        action: 'AUTO_APPROVE',
        priority: 1,
        enabled: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getActionConfig = (action: string) =>
    ACTIONS.find(a => a.value === action) || { value: action, label: action, color: 'bg-gray-100 text-gray-700' };

  const parseConditionDisplay = (rule: BusinessRule): string => {
    const field = CONDITION_FIELDS.find(f => f.value === rule.conditionField)?.label || rule.conditionField;
    const operator = OPERATORS.find(o => o.value === rule.conditionOperator)?.label || rule.conditionOperator;
    return `${field} ${operator} ${rule.conditionValue}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Business Rules Configuration</CardTitle>
            <CardDescription>
              Configure automatic approvals, expedited thresholds, and workflow rules
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
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
            <h4 className="font-semibold text-sm">New Business Rule</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Rule Name *</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Auto-approve small projects"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newRule.action}
                  onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                >
                  {ACTIONS.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Condition</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newRule.conditionField}
                  onChange={(e) => setNewRule(prev => ({ ...prev, conditionField: e.target.value }))}
                >
                  {CONDITION_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newRule.conditionOperator}
                  onChange={(e) => setNewRule(prev => ({ ...prev, conditionOperator: e.target.value }))}
                >
                  {OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Input
                  value={newRule.conditionValue}
                  onChange={(e) => setNewRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                  placeholder="Value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Priority (higher = first)</label>
                <Input
                  type="number"
                  min={1}
                  value={newRule.priority}
                  onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newRule.enabled}
                    onChange={(e) => setNewRule(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded"
                  />
                  Enabled
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading business rules...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gray-500">No business rules configured. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r, idx) => {
              const actionConfig = getActionConfig(r.action);
              return (
                <div key={r.id || idx} className={`flex items-center gap-3 p-3 border rounded-lg ${!r.enabled ? 'opacity-50' : ''}`}>
                  <Zap className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${actionConfig.color}`}>
                        {actionConfig.label}
                      </span>
                      {!r.enabled && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Disabled</span>
                      )}
                    </div>
                    {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      IF {parseConditionDisplay(r)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">P{r.priority}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
