/* eslint-disable no-restricted-globals */

// Simple PWA service worker for offline shell + basic caching.
// Note: keep this conservative to avoid stale data surprises.

const CACHE_VERSION = "kealee-gc-v1";
const OFFLINE_URL = "/offline";

const CORE_ASSETS = [
  OFFLINE_URL,
  "/portal",
  "/icons/kealee-gc.svg",
  "/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(CORE_ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_VERSION ? Promise.resolve() : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations, fallback to offline page.
  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // Cache-first for static-ish assets.
  const isStatic =
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|webp|gif|svg|css|js|map|woff2?)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});

// Background sync (placeholder)
// When you wire real upload endpoints, enqueue offline actions and replay them here.
self.addEventListener("sync", (event) => {
  if (event.tag !== "kealee-sync") return;
  event.waitUntil(
    (async () => {
      // No-op for now — we keep drafts in localStorage.
      // You can add IndexedDB queue + POST replay here.
      return;
    })()
  );
});

// Push notifications (requires server to send push)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Kealee GC Update";
  const body = data.body || "You have an update.";
  const url = data.url || "/portal";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/kealee-gc.svg",
      badge: "/icons/kealee-gc.svg",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/portal";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) {
        if ("focus" in c) {
          c.focus();
          if (c.url !== url && "navigate" in c) {
            c.navigate(url);
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

