// datadog-rum.config.ts
// Datadog RUM configuration for Next.js apps

import { datadogRum } from '@datadog/browser-rum';

export const datadogRumConfig = {
  applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || '',
  clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || '',
  site: process.env.DATADOG_SITE || 'datadoghq.com',
  service: process.env.DD_SERVICE || 'kealee-app',
  env: process.env.DD_ENV || process.env.NODE_ENV || 'production',
  version: process.env.DD_VERSION || '1.0.0',
  sampleRate: 100,
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input' as const,
};

// Initialize Datadog RUM
if (typeof window !== 'undefined' && datadogRumConfig.applicationId) {
  datadogRum.init(datadogRumConfig);
  
  datadogRum.startSessionReplayRecording();
}

export default datadogRum;
