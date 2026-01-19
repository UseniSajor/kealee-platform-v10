/**
 * Analytics Client for os-pm
 * Wraps analytics utilities with app-specific tracking
 */

import { initAnalytics, trackPageView, trackEvent, identifyUser, resetUser } from '@kealee/ui'

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
