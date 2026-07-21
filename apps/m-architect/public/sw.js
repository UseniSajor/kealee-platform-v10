/**
 * Kealee PWA Service Worker
 *
 * Provides:
 *  - Static asset caching (app shell, CSS, JS, fonts)
 *  - API response caching for offline viewing
 *  - Background sync for offline actions (photos, check-ins, daily logs)
 *  - Push notification support
 */

const CACHE_VERSION = 'kealee-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PHOTO_CACHE = `${CACHE_VERSION}-photos`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
];

// API endpoints to cache for offline viewing
const CACHEABLE_API_PATTERNS = [
  /\/api\/v1\/check-in\//,
  /\/api\/projects\//,
  /\/api\/v1\/sensors\//,
  /\/analytics\/dashboard\//,
  /\/milestones\//,
];

// Offline sync queue name
const SYNC_TAG = 'kealee-offline-sync';

// ============================================================================
// INSTALL — Pre-cache app shell
// ============================================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed (non-fatal):', err);
      });
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

// ============================================================================
// ACTIVATE — Clean old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('kealee-') && key !== STATIC_CACHE && key !== API_CACHE && key !== PHOTO_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ============================================================================
// FETCH — Network-first for API, cache-first for static assets
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST/PUT/DELETE go through offline queue)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // API requests: network-first with cache fallback
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Image/photo requests: cache-first
  if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, PHOTO_CACHE));
    return;
  }

  // Static assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline') || caches.match('/');
      })
    );
    return;
  }
});

// ============================================================================
// BACKGROUND SYNC — Process offline queue when connectivity returns
// ============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  try {
    // Open IndexedDB to read queued actions
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readwrite');
    const store = tx.objectStore('offline-queue');

    const allItems = await getAllFromStore(store);

    for (const item of allItems) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          // Remove from queue on success
          const deleteTx = db.transaction('offline-queue', 'readwrite');
          deleteTx.objectStore('offline-queue').delete(item.id);

          // Notify client of sync
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_ITEM_COMPLETE',
              id: item.id,
              action: item.action,
            });
          });
        }
      } catch (err) {
        console.warn('[SW] Sync item failed, will retry:', item.action, err);
      }
    }

    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'kealee-notification',
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || '/',
        ...data.data,
      },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Kealee', options)
    );
  } catch (err) {
    console.error('[SW] Push notification error:', err);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      const existingClient = clients.find((c) => c.url.includes(self.location.origin));
      if (existingClient) {
        existingClient.focus();
        existingClient.navigate(url);
        return;
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

// Handle notification close (analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics event here
});

// ============================================================================
// MESSAGE HANDLER — Communication with main thread
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'QUEUE_OFFLINE_ACTION':
      queueOfflineAction(payload);
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

async function queueOfflineAction(action) {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readwrite');
    const store = tx.objectStore('offline-queue');

    await store.put({
      ...action,
      id: action.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      queuedAt: new Date().toISOString(),
    });

    // Request background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
    }
  } catch (err) {
    console.error('[SW] Failed to queue offline action:', err);
  }
}

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('kealee-')).map((k) => caches.delete(k)));
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 504 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// ============================================================================
// HELPERS
// ============================================================================

function isApiRequest(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|otf)(\?.*)?$/i.test(url.pathname);
}

// Simple IndexedDB wrapper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kealee-sw', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
