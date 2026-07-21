'use client';

/**
 * ServiceWorkerRegistration — Registers the PWA service worker
 * and manages update notifications.
 *
 * Place in root layout:
 *   <ServiceWorkerRegistration />
 */

import React, { useEffect, useState, useCallback } from 'react';

export interface ServiceWorkerRegistrationProps {
  /** Path to the service worker file (default: /sw.js) */
  swPath?: string;
  /** Show update notification when new SW is available */
  showUpdatePrompt?: boolean;
}

export function ServiceWorkerRegistration({
  swPath = '/sw.js',
  showUpdatePrompt = true,
}: ServiceWorkerRegistrationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register(swPath, {
          scope: '/',
        });

        setRegistration(reg as any);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              setUpdateAvailable(true);
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type } = event.data || {};
          if (type === 'SYNC_COMPLETE') {
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('kealee:sync-complete'));
          }
          if (type === 'SYNC_ITEM_COMPLETE') {
            window.dispatchEvent(
              new CustomEvent('kealee:sync-item', { detail: event.data })
            );
          }
        });
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err);
      }
    }

    register();
  }, [swPath]);

  const handleUpdate = useCallback(() => {
    if (registration && (registration as any).waiting) {
      (registration as any).waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const handleDismiss = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  if (!updateAvailable || !showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Update Available</p>
            <p className="mt-0.5 text-xs text-gray-500">
              A new version of Kealee is ready.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceWorkerRegistration;
