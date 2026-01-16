/**
 * API Key Creation Form
 */

'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

interface ApiKeyCreateFormProps {
  onSubmit: (data: {
    name: string;
    jurisdictionId?: string;
    organizationId?: string;
    scopes: string[];
    rateLimit: number;
    expiresAt?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ApiKeyCreateForm({onSubmit, onCancel, isLoading}: ApiKeyCreateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    jurisdictionId: '',
    organizationId: '',
    scopes: ['read'] as string[],
    rateLimit: 100,
    expiresAt: '',
  });

  const availableScopes = ['read', 'write', 'admin', 'webhooks'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      jurisdictionId: formData.jurisdictionId || undefined,
      organizationId: formData.organizationId || undefined,
      scopes: formData.scopes,
      rateLimit: formData.rateLimit,
      expiresAt: formData.expiresAt || undefined,
    });
  };

  const toggleScope = (scope: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Key Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
          placeholder="e.g., Production API Key"
          required
        />
        <p className="text-sm text-gray-500">A descriptive name for this API key</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jurisdictionId">Jurisdiction ID (Optional)</Label>
          <Input
            id="jurisdictionId"
            value={formData.jurisdictionId}
            onChange={(e) => setFormData(prev => ({...prev, jurisdictionId: e.target.value}))}
            placeholder="jurisdiction-uuid"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationId">Organization ID (Optional)</Label>
          <Input
            id="organizationId"
            value={formData.organizationId}
            onChange={(e) => setFormData(prev => ({...prev, organizationId: e.target.value}))}
            placeholder="organization-uuid"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Scopes *</Label>
        <div className="flex flex-wrap gap-2">
          {availableScopes.map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => toggleScope(scope)}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                formData.scopes.includes(scope)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {scope}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500">Select the permissions for this API key</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rateLimit">Rate Limit (requests per minute) *</Label>
        <Input
          id="rateLimit"
          type="number"
          min="1"
          value={formData.rateLimit}
          onChange={(e) => setFormData(prev => ({...prev, rateLimit: parseInt(e.target.value) || 100}))}
          required
        />
        <p className="text-sm text-gray-500">Maximum number of requests allowed per minute</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="date"
          value={formData.expiresAt}
          onChange={(e) => setFormData(prev => ({...prev, expiresAt: e.target.value}))}
        />
        <p className="text-sm text-gray-500">Leave empty for keys that never expire</p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name || formData.scopes.length === 0}>
          {isLoading ? 'Creating...' : 'Create API Key'}
        </Button>
      </div>
    </form>
  );
}
