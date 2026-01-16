import NetInfo from '@react-native-community/netinfo';
import {StorageService} from './storage';
import {Inspection, OfflineQueueItem, SyncConflict} from '../types';
import {ApiService} from './api';

export class SyncService {
  private static isSyncing = false;
  private static syncListeners: Array<() => void> = [];

  static addSyncListener(listener: () => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.syncListeners.forEach((listener) => listener());
  }

  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  static async syncAll(): Promise<{success: boolean; conflicts: SyncConflict[]}> {
    if (this.isSyncing) {
      return {success: false, conflicts: []};
    }

    const isOnline = await this.isOnline();
    if (!isOnline) {
      return {success: false, conflicts: []};
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      // Sync offline queue
      const queue = await StorageService.getOfflineQueue();
      const conflicts: SyncConflict[] = [];

      for (const item of queue) {
        try {
          await this.syncQueueItem(item);
          await StorageService.removeFromOfflineQueue(item.id);
        } catch (error: any) {
          if (error.conflict) {
            conflicts.push(error.conflict);
          } else {
            // Retry logic
            item.retryCount++;
            if (item.retryCount < 3) {
              await StorageService.addToOfflineQueue(item);
            }
          }
        }
      }

      // Sync inspections
      const inspections = await StorageService.getAllInspections();
      for (const inspection of inspections) {
        if (!inspection.synced) {
          try {
            await this.syncInspection(inspection);
            inspection.synced = true;
            await StorageService.saveInspection(inspection);
          } catch (error: any) {
            if (error.conflict) {
              conflicts.push(error.conflict);
            }
          }
        }
      }

      // Download new inspections
      await this.downloadInspections();

      await StorageService.setLastSync(new Date().toISOString());

      return {success: true, conflicts};
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private static async syncQueueItem(item: OfflineQueueItem): Promise<void> {
    switch (item.type) {
      case 'inspection':
        if (item.action === 'create') {
          await ApiService.createInspection(item.data);
        } else if (item.action === 'update') {
          await ApiService.updateInspection(item.data.id, item.data);
        } else if (item.action === 'delete') {
          await ApiService.deleteInspection(item.data.id);
        }
        break;
      case 'photo':
        await ApiService.uploadInspectionPhoto(item.data.inspectionId, item.data);
        break;
      case 'sketch':
        await ApiService.uploadInspectionSketch(item.data.inspectionId, item.data);
        break;
      case 'note':
        await ApiService.addInspectionNote(item.data.inspectionId, item.data);
        break;
      case 'signature':
        await ApiService.addInspectionSignature(item.data.inspectionId, item.data);
        break;
    }
  }

  private static async syncInspection(inspection: Inspection): Promise<void> {
    try {
      const serverInspection = await ApiService.getInspection(inspection.id);
      
      // Check for conflicts
      if (serverInspection && serverInspection.updatedAt !== inspection.updatedAt) {
        const conflict: SyncConflict = {
          id: `conflict-${inspection.id}-${Date.now()}`,
          inspectionId: inspection.id,
          localVersion: inspection,
          serverVersion: serverInspection,
          conflictType: 'edit',
          resolved: false,
        };
        await StorageService.saveSyncConflict(conflict);
        throw {conflict};
      }

      await ApiService.updateInspection(inspection.id, inspection);
    } catch (error: any) {
      if (!error.conflict) {
        // Inspection doesn't exist on server, create it
        await ApiService.createInspection(inspection);
      } else {
        throw error;
      }
    }
  }

  private static async downloadInspections(): Promise<void> {
    const lastSync = await StorageService.getLastSync();
    const inspections = await ApiService.getInspections(lastSync);

    for (const inspection of inspections) {
      const local = await StorageService.getInspection(inspection.id);
      if (!local || new Date(inspection.updatedAt) > new Date(local.updatedAt)) {
        inspection.synced = true;
        await StorageService.saveInspection(inspection);
      }
    }
  }

  static async startBackgroundSync(): Promise<void> {
    // Set up background sync
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncAll();
      }
    });

    // Periodic sync every 5 minutes when online
    setInterval(async () => {
      if (await this.isOnline()) {
        await this.syncAll();
      }
    }, 5 * 60 * 1000);
  }

  static isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}
