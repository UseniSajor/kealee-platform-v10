/**
 * Analytics Client for os-pm
 * Wraps analytics utilities with app-specific tracking
 */

// Local analytics stubs - can be replaced with real implementation when PostHog is configured
function initAnalytics(_provider: string, _key?: string) {
  // No-op stub
}

function trackPageView(path: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Analytics] Page view:', path, properties)
  }
}

function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Analytics] Event:', name, properties)
  }
}

function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Analytics] Identify:', userId, traits)
  }
}

function resetUser() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.debug('[Analytics] Reset user')
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initAnalytics('posthog', process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

export const analytics = {
  /**
   * Track page view
   */
  pageView: (path: string, properties?: Record<string, any>) => {
    trackPageView(path, {
      app: 'os-pm',
      ...properties,
    })
  },

  /**
   * Track PM-specific events
   */
  trackTaskCreated: (taskId: string, properties?: Record<string, any>) => {
    trackEvent('Task Created', {
      app: 'os-pm',
      taskId,
      ...properties,
    })
  },

  trackTaskCompleted: (taskId: string, properties?: Record<string, any>) => {
    trackEvent('Task Completed', {
      app: 'os-pm',
      taskId,
      ...properties,
    })
  },

  trackClientAssigned: (clientId: string, pmId: string) => {
    trackEvent('Client Assigned', {
      app: 'os-pm',
      clientId,
      pmId,
    })
  },

  trackReportGenerated: (reportType: string) => {
    trackEvent('Report Generated', {
      app: 'os-pm',
      reportType,
    })
  },

  /**
   * Identify user
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    identifyUser(userId, {
      app: 'os-pm',
      ...traits,
    })
  },

  /**
   * Reset on logout
   */
  reset: () => {
    resetUser()
  },
}
