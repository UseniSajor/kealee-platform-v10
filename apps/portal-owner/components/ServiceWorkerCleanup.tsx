'use client'

import { useEffect } from 'react'

/**
 * Removes any service worker left on this origin by the app that used to be
 * served here. Without this a returning customer's browser answers portal
 * requests from a stale cache — including a PWA "You're Offline" page that is
 * not part of this app — and a paid order can look broken when it is not.
 *
 * Safe to keep: the portal registers no service worker of its own, so this
 * only ever removes something that should not be here.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        if (registrations.length === 0) return
        await Promise.all(registrations.map((registration) => registration.unregister()))
        if (typeof caches !== 'undefined') {
          const names = await caches.keys()
          await Promise.all(names.map((name) => caches.delete(name)))
        }
        // The page currently on screen may itself have come from that cache.
        window.location.reload()
      })
      .catch(() => undefined)
  }, [])

  return null
}
