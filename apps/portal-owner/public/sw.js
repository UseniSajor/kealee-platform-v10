/**
 * Owner portal service-worker kill switch.
 *
 * owner.kealee.com previously served a different app (the m-marketplace owner
 * PWA) whose service worker is still installed in returning customers'
 * browsers. It intercepts every request on this origin, so when the portal is
 * briefly unreachable it serves that app's "You're Offline" page instead of
 * the portal — a page this app does not contain and a message that blames the
 * customer's connection for an outage on our side.
 *
 * The portal is not a PWA. This file exists only so the browser replaces the
 * stale worker with one that removes itself and its caches.
 */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})

// Never intercept: every request goes straight to the network.
