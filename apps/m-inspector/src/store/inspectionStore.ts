import {create} from 'zustand';
import {Inspection, Route, SyncConflict} from '../types';
import {StorageService} from '../services/storage';
import {SyncService} from '../services/sync';

interface InspectionState {
  inspections: Inspection[];
  currentInspection: Inspection | null;
  route: Route | null;
  conflicts: SyncConflict[];
  isSyncing: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadInspections: (date?: string) => Promise<void>;
  setCurrentInspection: (inspection: Inspection | null) => void;
  updateInspection: (inspection: Inspection) => Promise<void>;
  saveInspection: (inspection: Inspection) => Promise<void>;
  loadRoute: (date: string) => Promise<void>;
  sync: () => Promise<void>;
  loadConflicts: () => Promise<void>;
  resolveConflict: (conflictId: string, useLocal: boolean) => Promise<void>;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: [],
  currentInspection: null,
  route: null,
  conflicts: [],
  isSyncing: false,
  isLoading: false,
  error: null,

  loadInspections: async (date?: string) => {
    set({isLoading: true, error: null});
    try {
      const inspections = date
        ? await StorageService.getInspectionsForDate(date)
        : await StorageService.getAllInspections();
      set({inspections, isLoading: false});
    } catch (error: any) {
      set({error: error.message, isLoading: false});
    }
  },

  setCurrentInspection: (inspection) => {
    set({currentInspection: inspection});
  },

  updateInspection: async (inspection) => {
    try {
      inspection.synced = false;
      await StorageService.saveInspection(inspection);
      const inspections = get().inspections;
      const index = inspections.findIndex((i) => i.id === inspection.id);
      if (index >= 0) {
        inspections[index] = inspection;
      } else {
        inspections.push(inspection);
      }
      set({inspections, currentInspection: inspection});
    } catch (error: any) {
      set({error: error.message});
    }
  },

  saveInspection: async (inspection) => {
    try {
      await StorageService.saveInspection(inspection);
      const inspections = get().inspections;
      const index = inspections.findIndex((i) => i.id === inspection.id);
      if (index >= 0) {
        inspections[index] = inspection;
      } else {
        inspections.push(inspection);
      }
      set({inspections});
    } catch (error: any) {
      set({error: error.message});
    }
  },

  loadRoute: async (date: string) => {
    set({isLoading: true});
    try {
      const {RouteOptimizationService} = await import('../services/route-optimization');
      const route = await RouteOptimizationService.optimizeRouteForDate(date);
      set({route, isLoading: false});
    } catch (error: any) {
      set({error: error.message, isLoading: false});
    }
  },

  sync: async () => {
    set({isSyncing: true, error: null});
    try {
      const result = await SyncService.syncAll();
      if (result.conflicts.length > 0) {
        await get().loadConflicts();
      }
      await get().loadInspections();
      set({isSyncing: false});
    } catch (error: any) {
      set({error: error.message, isSyncing: false});
    }
  },

  loadConflicts: async () => {
    const conflicts = await StorageService.getSyncConflicts();
    set({conflicts});
  },

  resolveConflict: async (conflictId: string, useLocal: boolean) => {
    const conflicts = get().conflicts;
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    try {
      const resolvedInspection = useLocal ? conflict.localVersion : conflict.serverVersion;
      resolvedInspection.synced = false;
      await StorageService.saveInspection(resolvedInspection);
      await StorageService.resolveSyncConflict(conflictId);
      
      const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
      set({conflicts: updatedConflicts});
      
      // Update inspections list
      const inspections = get().inspections;
      const index = inspections.findIndex((i) => i.id === resolvedInspection.id);
      if (index >= 0) {
        inspections[index] = resolvedInspection;
        set({inspections});
      }
    } catch (error: any) {
      set({error: error.message});
    }
  },
}));
