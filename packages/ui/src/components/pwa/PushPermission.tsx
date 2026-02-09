'use client';

/**
 * PushPermission — Prompts user to enable push notifications
 *
 * Shows a dismissable card (not a browser popup) asking the user
 * to enable push notifications. Stores the subscription in the
 * PushSubscription model via API.
 *
 * Usage:
 *   <PushPermission
 *     userId="user_123"
 *     apiBase="http://localhost:3000"
 *   />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface PushPermissionProps {
  /** User identifier */
  userId: string;
  /** API base URL */
  apiBase?: string;
  /** VAPID public key (from env) */
  vapidPublicKey?: string;
  /** Delay before showing prompt (ms, default 5000) */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when user subscribes */
  onSubscribed?: () => void;
  /** Callback when user dismisses */
  onDismissed?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PushPermission({
  userId,
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  delay = 5000,
  className,
  onSubscribed,
  onDismissed,
}: PushPermissionProps) {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    // Don't show if:
    // - SSR
    // - No push support
    // - Already granted/denied
    // - Already dismissed (stored in localStorage)
    // - No VAPID key configured
    if (typeof window === 'undefined') return;
    if (!('PushManager' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (!vapidPublicKey) return;

    const dismissed = localStorage.getItem('kealee:push-dismissed');
    if (dismissed) return;

    // Check current permission state
    if (Notification.permission === 'granted') {
      checkExistingSubscription();
      return;
    }
    if (Notification.permission === 'denied') return;

    // Show prompt after delay
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay, vapidPublicKey]);

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setAlreadySubscribed(true);
      }
    } catch {
      // Ignore errors
    }
  }

  const handleEnable = useCallback(async () => {
    setSubscribing(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setVisible(false);
        return;
      }

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      await fetch(`${apiBase}/api/v1/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          platform: (navigator as any).userAgentData?.platform || navigator.platform || 'unknown',
        }),
      });

      setAlreadySubscribed(true);
      setVisible(false);
      onSubscribed?.();
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
    } finally {
      setSubscribing(false);
    }
  }, [userId, apiBase, vapidPublicKey, onSubscribed]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('kealee:push-dismissed', 'true');
    setVisible(false);
    onDismissed?.();
  }, [onDismissed]);

  if (!visible || alreadySubscribed) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-[9998] sm:left-auto sm:right-4 sm:w-96',
        className
      )}
    >
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        {/* Icon */}
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-gray-900">
          Stay updated on your project
        </h3>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          Get notified instantly when payments arrive, decisions are needed,
          or your contractor checks in. You can customize which notifications
          you receive.
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleEnable}
            disabled={subscribing}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              subscribing
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            )}
          >
            {subscribing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enabling...
              </>
            ) : (
              'Enable Notifications'
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushPermission;
