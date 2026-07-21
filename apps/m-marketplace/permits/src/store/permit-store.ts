// ============================================================
// PERMIT STORE (Zustand)
// ============================================================

import { create } from 'zustand';
import { Permit } from '@permits/src/types';

interface PermitState {
  permits: Permit[];
  selectedPermit: Permit | null;
  filters: {
    status?: string;
    jurisdictionId?: string;
    permitType?: string;
  };
  setPermits: (permits: Permit[]) => void;
  addPermit: (permit: Permit) => void;
  updatePermit: (id: string, updates: Partial<Permit>) => void;
  setSelectedPermit: (permit: Permit | null) => void;
  setFilters: (filters: Partial<PermitState['filters']>) => void;
}

export const usePermitStore = create<PermitState>((set) => ({
  permits: [],
  selectedPermit: null,
  filters: {},
  setPermits: (permits) => set({ permits }),
  addPermit: (permit) => set((state) => ({ permits: [...state.permits, permit] })),
  updatePermit: (id, updates) =>
    set((state) => ({
      permits: state.permits.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  setSelectedPermit: (permit) => set({ selectedPermit: permit }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
