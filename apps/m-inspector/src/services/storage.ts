import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import {Inspection, OfflineQueueItem, SyncConflict} from '../types';

const STORAGE_KEYS = {
  INSPECTIONS: '@inspections',
  OFFLINE_QUEUE: '@offline_queue',
  SYNC_CONFLICTS: '@sync_conflicts',
  LAST_SYNC: '@last_sync',
  USER_PREFERENCES: '@user_preferences',
};

export class StorageService {
  // Inspections
  static async saveInspection(inspection: Inspection): Promise<void> {
    const inspections = await this.getAllInspections();
    const index = inspections.findIndex((i) => i.id === inspection.id);
    if (index >= 0) {
      inspections[index] = inspection;
    } else {
      inspections.push(inspection);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
  }

  static async getInspection(id: string): Promise<Inspection | null> {
    const inspections = await this.getAllInspections();
    return inspections.find((i) => i.id === id) || null;
  }

  static async getAllInspections(): Promise<Inspection[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INSPECTIONS);
    return data ? JSON.parse(data) : [];
  }

  static async getInspectionsForDate(date: string): Promise<Inspection[]> {
    const inspections = await this.getAllInspections();
    return inspections.filter((i) => i.scheduledDate.startsWith(date));
  }

  static async deleteInspection(id: string): Promise<void> {
    const inspections = await this.getAllInspections();
    const filtered = inspections.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(filtered));
  }

  // Offline Queue
  static async addToOfflineQueue(item: OfflineQueueItem): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push(item);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  }

  static async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  static async removeFromOfflineQueue(id: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
  }

  static async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // Sync Conflicts
  static async saveSyncConflict(conflict: SyncConflict): Promise<void> {
    const conflicts = await this.getSyncConflicts();
    const index = conflicts.findIndex((c) => c.id === conflict.id);
    if (index >= 0) {
      conflicts[index] = conflict;
    } else {
      conflicts.push(conflict);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_CONFLICTS, JSON.stringify(conflicts));
  }

  static async getSyncConflicts(): Promise<SyncConflict[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_CONFLICTS);
    return data ? JSON.parse(data) : [];
  }

  static async resolveSyncConflict(id: string): Promise<void> {
    const conflicts = await this.getSyncConflicts();
    const filtered = conflicts.filter((c) => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_CONFLICTS, JSON.stringify(filtered));
  }

  // Last Sync
  static async setLastSync(timestamp: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  static async getLastSync(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  // Secure Storage (for sensitive data)
  static async saveSecure(key: string, value: string): Promise<void> {
    await EncryptedStorage.setItem(key, value);
  }

  static async getSecure(key: string): Promise<string | null> {
    return await EncryptedStorage.getItem(key);
  }

  static async removeSecure(key: string): Promise<void> {
    await EncryptedStorage.removeItem(key);
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.INSPECTIONS,
      STORAGE_KEYS.OFFLINE_QUEUE,
      STORAGE_KEYS.SYNC_CONFLICTS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  }
}
