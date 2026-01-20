// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filter out health check noise
  ignoreErrors: [
    'Non-Error exception captured',
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
  ],
  
  beforeSend(event, hint) {
    // Filter out browser extension errors
    if (event.message?.includes('chrome-extension://') || 
        event.message?.includes('moz-extension://')) {
      return null;
    }
    
    // Filter out network errors from users with poor connections
    if (event.message?.includes('Failed to fetch') || 
        event.message?.includes('NetworkError')) {
      return null;
    }
    
    return event;
  },
});
