// ============================================================
// STATUS SYNC COMPONENT
// Sync permit status with jurisdiction portals
// ============================================================

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusSyncProps {
  permitId: string;
  jurisdictionId: string;
  currentStatus: string;
}

export function StatusSync({ permitId, jurisdictionId, currentStatus }: StatusSyncProps) {
  const [syncing, setSyncing] = useState(false);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/permits/${permitId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      // Refetch permit data
      window.location.reload();
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge>{currentStatus.replace(/_/g, ' ')}</Badge>
        </div>
        <p className="text-xs text-gray-500">
          Last synced with jurisdiction portal
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing || syncMutation.isPending}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${syncing || syncMutation.isPending ? 'animate-spin' : ''}`}
        />
        Sync Status
      </Button>
    </div>
  );
}
