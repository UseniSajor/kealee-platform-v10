'use client';

import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  organization_id?: string;
  created_at: string;
  [key: string]: unknown;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function useProfile() {
  const { isLoaded, user } = useUser();
  const profile = useMemo<Profile | null>(() => {
    if (!user) return null;
    const metadata = user.unsafeMetadata as Record<string, unknown>;
    return {
      ...metadata,
      id: user.id,
      full_name: user.fullName ?? stringValue(metadata.full_name) ?? '',
      email: user.primaryEmailAddress?.emailAddress ?? '',
      avatar_url: user.imageUrl,
      role: stringValue(user.publicMetadata.role) ?? stringValue(metadata.role) ?? 'customer',
      organization_id: stringValue(user.publicMetadata.organization_id) ?? stringValue(metadata.organization_id),
      created_at: user.createdAt?.toISOString() ?? new Date(0).toISOString(),
    };
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated');
    const { full_name, ...metadataUpdates } = updates;
    const names = full_name?.trim().split(/\s+/) ?? [];
    await user.update({
      ...(full_name !== undefined ? { firstName: names[0] ?? '', lastName: names.slice(1).join(' ') } : {}),
      unsafeMetadata: { ...user.unsafeMetadata, ...metadataUpdates },
    });
    return { ...profile, ...updates, id: user.id } as Profile;
  }, [profile, user]);

  const refetch = useCallback(async () => {
    if (user) await user.reload();
  }, [user]);

  return { profile, loading: !isLoaded, updateProfile, refetch };
}
