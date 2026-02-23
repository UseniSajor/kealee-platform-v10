// ============================================================
// PERMITS HOOKS
// Custom hooks for permit data
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@permits/src/lib/supabase/client';

export function usePermits(filters?: {
  status?: string;
  jurisdictionId?: string;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['permits', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('Permit')
        .select('*')
        .eq('clientId', user.id);

      if (filters?.status) {
        query = query.eq('kealeeStatus', filters.status);
      }

      if (filters?.jurisdictionId) {
        query = query.eq('jurisdictionId', filters.jurisdictionId);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function usePermit(permitId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['permit', permitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Permit')
        .select('*')
        .eq('id', permitId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!permitId,
  });
}

export function useSubmitPermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ permitId, submittedVia }: { permitId: string; submittedVia?: string }) => {
      const response = await fetch(`/api/permits/${permitId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submittedVia }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permit', variables.permitId] });
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
  });
}

export function useSyncPermitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permitId: string) => {
      const response = await fetch(`/api/permits/${permitId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: (_, permitId) => {
      queryClient.invalidateQueries({ queryKey: ['permit', permitId] });
    },
  });
}
