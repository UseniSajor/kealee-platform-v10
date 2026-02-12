'use client';

/**
 * useOfflineQueue — Offline-first data sync for field workers
 *
 * Detects connectivity, queues write operations to IndexedDB when offline,
 * and syncs them when connectivity returns via the service worker's
 * Background Sync API.
 *
 * Usage:
 *   const { isOnline, pendingCount, queueAction, syncStatus } = useOfflineQueue();
 *
 *   // Queue an action (works both online and offline)
 *   await queueAction({
 *     action: 'check-in',
 *     url: '/api/v1/check-in',
 *     method: 'POST',
 *     body: { userId, projectId, ... },
 *   });
 *
 * Offline-capable actions:
 *   - Take and store photos
 *   - Write daily log entries
 *   - Check in / check out
 *   - View project details (cached)
 *   - Draft messages
 *
 * Requires-online actions (blocked when offline):
 *   - Submit bids (financial)
 *   - Approve payments (financial)
 *   - Sign contracts (legal)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineAction {
  /** Unique identifier */
  id?: string;
  /** Human-readable action description */
  action: string;
  /** Category for grouping */
  category?: 'photo' | 'check-in' | 'daily-log' | 'message' | 'general';
  /** API endpoint URL */
  url: string;
  /** HTTP method */
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Timestamp when queued */
  queuedAt?: string;
  /** Binary data (e.g., photo) stored as base64 */
  binaryData?: string;
  /** Status */
  status?: 'pending' | 'syncing' | 'failed';
  /** Number of retry attempts */
  retryCount?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error';

export interface UseOfflineQueueReturn {
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Number of actions in the offline queue */
  pendingCount: number;
  /** List of pending actions */
  pendingActions: OfflineAction[];
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Queue an action for sync (works online and offline) */
  queueAction: (action: OfflineAction) => Promise<void>;
  /** Manually trigger sync attempt */
  triggerSync: () => Promise<void>;
  /** Clear all pending actions */
  clearQueue: () => Promise<void>;
  /** Remove a specific action from queue */
  removeAction: (id: string) => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'kealee-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

/**
 * Actions that MUST NOT be queued offline (financial/legal)
 */
const BLOCKED_OFFLINE_PATTERNS = [
  '/bids',
  '/payments',
  '/escrow',
  '/contracts',
  '/billing',
  '/deposits',
  '/stripe',
];

// ============================================================================
// IndexedDB HELPERS
// ============================================================================

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToStore(action: OfflineAction): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllFromStore(): Promise<OfflineAction[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearStore(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================================
// HOOK
// ============================================================================

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncingRef = useRef(false);

  // ── Online/Offline detection ──────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when coming back online
      attemptSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Listen for SW sync messages ───────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSyncComplete = () => {
      setSyncStatus('complete');
      loadPendingActions();
      setTimeout(() => setSyncStatus('idle'), 3000);
    };

    const handleSyncItem = (event: CustomEvent) => {
      loadPendingActions();
    };

    window.addEventListener('kealee:sync-complete', handleSyncComplete);
    window.addEventListener('kealee:sync-item', handleSyncItem as EventListener);

    return () => {
      window.removeEventListener('kealee:sync-complete', handleSyncComplete);
      window.removeEventListener('kealee:sync-item', handleSyncItem as EventListener);
    };
  }, []);

  // ── Load pending actions on mount ─────────────────────────────

  useEffect(() => {
    loadPendingActions();
  }, []);

  async function loadPendingActions() {
    try {
      const actions = await getAllFromStore();
      setPendingActions(actions.sort((a, b) => {
        const aTime = a.queuedAt ? new Date(a.queuedAt).getTime() : 0;
        const bTime = b.queuedAt ? new Date(b.queuedAt).getTime() : 0;
        return aTime - bTime;
      }));
    } catch {
      // IndexedDB not available (SSR)
    }
  }

  // ── Queue an action ───────────────────────────────────────────

  const queueAction = useCallback(async (action: OfflineAction) => {
    // Block financial/legal actions when offline
    if (!navigator.onLine) {
      const isBlocked = BLOCKED_OFFLINE_PATTERNS.some((pattern) =>
        action.url.includes(pattern)
      );
      if (isBlocked) {
        throw new Error(
          'This action requires an internet connection. ' +
          'Financial and legal operations cannot be queued offline.'
        );
      }
    }

    const enrichedAction: OfflineAction = {
      ...action,
      id: action.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: action.queuedAt || new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers,
      },
    };

    if (navigator.onLine) {
      // If online, try to send immediately
      try {
        const response = await fetch(enrichedAction.url, {
          method: enrichedAction.method,
          headers: enrichedAction.headers,
          body: enrichedAction.body ? JSON.stringify(enrichedAction.body) : undefined,
        });

        if (response.ok) {
          return; // Sent successfully, no need to queue
        }

        // Server error — queue for retry
        console.warn('[OfflineQueue] Server error, queuing for retry');
      } catch {
        // Network error — queue
        console.warn('[OfflineQueue] Network error, queuing');
      }
    }

    // Store in IndexedDB
    await addToStore(enrichedAction);
    await loadPendingActions();

    // Tell service worker to queue it too (for background sync)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_OFFLINE_ACTION',
        payload: enrichedAction,
      });
    }
  }, []);

  // ── Manual sync trigger ───────────────────────────────────────

  const attemptSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;

    syncingRef.current = true;
    setSyncStatus('syncing');

    try {
      const actions = await getAllFromStore();

      for (const action of actions) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body ? JSON.stringify(action.body) : undefined,
          });

          if (response.ok) {
            await deleteFromStore(action.id!);
          } else {
            // Increment retry count
            await addToStore({
              ...action,
              retryCount: (action.retryCount || 0) + 1,
              status: 'failed',
            });
          }
        } catch {
          // Network error during sync — stop trying
          break;
        }
      }

      await loadPendingActions();
      setSyncStatus('complete');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // ── Clear queue ───────────────────────────────────────────────

  const clearQueueFn = useCallback(async () => {
    await clearStore();
    setPendingActions([]);
    setSyncStatus('idle');
  }, []);

  // ── Remove single action ──────────────────────────────────────

  const removeAction = useCallback(async (id: string) => {
    await deleteFromStore(id);
    await loadPendingActions();
  }, []);

  return {
    isOnline,
    pendingCount: pendingActions.length,
    pendingActions,
    syncStatus,
    queueAction,
    triggerSync: attemptSync,
    clearQueue: clearQueueFn,
    removeAction,
  };
}

export default useOfflineQueue;
