/**
 * usePushNotifications — React hook for Web Push notifications
 *
 * Provides:
 *  - Service worker registration
 *  - Push subscription management
 *  - Notification permission flow
 *  - Auto-subscribe on permission grant
 *
 * Usage:
 *   const { isSupported, permission, subscribe, unsubscribe } = usePushNotifications({
 *     apiUrl: process.env.NEXT_PUBLIC_API_URL,
 *     userId: session?.user?.id,
 *   })
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface PushNotificationOptions {
  /** Backend API URL (e.g. process.env.NEXT_PUBLIC_API_URL) */
  apiUrl?: string
  /** Current user ID */
  userId?: string
  /** Auto-subscribe when permission is granted (default: true) */
  autoSubscribe?: boolean
  /** Path to service worker file (default: '/sw.js') */
  swPath?: string
}

interface PushNotificationState {
  /** Browser supports push notifications */
  isSupported: boolean
  /** Current notification permission status */
  permission: NotificationPermission | 'unsupported'
  /** Whether user has an active push subscription */
  isSubscribed: boolean
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Request permission and subscribe */
  subscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>
  /** Register service worker (called automatically) */
  registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>
}

export function usePushNotifications(options: PushNotificationOptions = {}): PushNotificationState {
  const {
    apiUrl = '',
    userId,
    autoSubscribe = true,
    swPath = '/sw.js',
  } = options

  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)

  // Check browser support
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported) return null

    try {
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
      })

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready
      swRegistration.current = registration

      // Check if already subscribed
      const existingSub = await registration.pushManager.getSubscription()
      setIsSubscribed(!!existingSub)

      return registration
    } catch (err: any) {
      console.error('[Push] Service worker registration failed:', err)
      setError(`Service worker registration failed: ${err.message}`)
      return null
    }
  }, [isSupported, swPath])

  // Register SW on mount
  useEffect(() => {
    if (isSupported) {
      registerServiceWorker()
    }
  }, [isSupported, registerServiceWorker])

  // Auto-subscribe when permission is already granted + userId available
  useEffect(() => {
    if (autoSubscribe && permission === 'granted' && userId && !isSubscribed && isSupported) {
      subscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, userId, isSupported])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) {
      setError('Push notifications not supported or user not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result)

        if (result !== 'granted') {
          setError('Notification permission denied')
          setIsLoading(false)
          return false
        }
      }

      // Ensure SW is registered
      let registration = swRegistration.current
      if (!registration) {
        registration = await registerServiceWorker()
      }

      if (!registration) {
        setError('Service worker not available')
        setIsLoading(false)
        return false
      }

      // Get VAPID public key from backend
      let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

      if (!vapidPublicKey && apiUrl) {
        try {
          const res = await fetch(`${apiUrl}/api/v1/push/vapid-key`)
          const data = await res.json()
          vapidPublicKey = data.publicKey || ''
        } catch {
          console.warn('[Push] Could not fetch VAPID key from server')
        }
      }

      if (!vapidPublicKey) {
        setError('VAPID public key not configured')
        setIsLoading(false)
        return false
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // Send subscription to backend
      if (apiUrl) {
        const res = await fetch(`${apiUrl}/api/v1/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
                auth: arrayBufferToBase64(subscription.getKey('auth')!),
              },
            },
            userAgent: navigator.userAgent,
            platform: detectPlatform(),
          }),
        })

        if (!res.ok) {
          throw new Error('Failed to register subscription with server')
        }
      }

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (err: any) {
      console.error('[Push] Subscribe failed:', err)
      setError(err.message || 'Failed to subscribe')
      setIsLoading(false)
      return false
    }
  }, [isSupported, userId, apiUrl, registerServiceWorker])

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = swRegistration.current || (await navigator.serviceWorker.ready)
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Notify backend
        if (apiUrl) {
          await fetch(`${apiUrl}/api/v1/push/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          }).catch(() => {})
        }

        // Unsubscribe from push
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (err: any) {
      console.error('[Push] Unsubscribe failed:', err)
      setError(err.message || 'Failed to unsubscribe')
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    registerServiceWorker,
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('win')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  return 'Unknown'
}
