'use client';

/**
 * PWA Provider — Client component for service worker registration
 * and offline status management.
 */

import { ServiceWorkerRegistration } from '@kealee/ui';

export function PWAProvider() {
  return <ServiceWorkerRegistration />;
}
