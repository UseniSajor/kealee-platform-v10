/**
 * Analytics Integration
 * Supports PostHog and Mixpanel
 */

let analyticsInitialized = false
let analyticsProvider: 'posthog' | 'mixpanel' | null = null

export function initAnalytics(provider: 'posthog' | 'mixpanel' = 'posthog', apiKey?: string) {
  if (analyticsInitialized || typeof window === 'undefined') return

  const key = apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_MIXPANEL_KEY

  if (!key) {
    console.warn('Analytics API key not configured. Analytics disabled.')
    return
  }

  try {
    if (provider === 'posthog') {
      import('posthog-js').then((posthog) => {
        posthog.default.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          loaded: (posthog) => {
            analyticsProvider = 'posthog'
            analyticsInitialized = true
            console.log('✅ PostHog initialized')
          },
        })
        ;(window as any).posthog = posthog.default
      }).catch(() => {
        console.warn('PostHog package not installed. Run: pnpm add posthog-js')
      })
    } else if (provider === 'mixpanel') {
      import('mixpanel-browser').then((mixpanel) => {
        mixpanel.default.init(key, {
          debug: process.env.NODE_ENV === 'development',
        })
        analyticsProvider = 'mixpanel'
        analyticsInitialized = true
        console.log('✅ Mixpanel initialized')
        ;(window as any).mixpanel = mixpanel.default
      }).catch(() => {
        console.warn('Mixpanel package not installed. Run: pnpm add mixpanel-browser')
      })
    }
  } catch (error) {
    console.warn('Failed to initialize analytics:', error)
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined' || !analyticsInitialized) return

  try {
    if (analyticsProvider === 'posthog' && (window as any).posthog) {
      ;(window as any).posthog.capture('$pageview', {
        $current_url: window.location.href,
        path,
        ...properties,
      })
    } else if (analyticsProvider === 'mixpanel' && (window as any).mixpanel) {
      ;(window as any).mixpanel.track('Page View', {
        path,
        url: window.location.href,
        ...properties,
      })
    }
  } catch (error) {
    console.warn('Failed to track page view:', error)
  }
}

/**
 * Track event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined' || !analyticsInitialized) return

  try {
    if (analyticsProvider === 'posthog' && (window as any).posthog) {
      ;(window as any).posthog.capture(eventName, properties)
    } else if (analyticsProvider === 'mixpanel' && (window as any).mixpanel) {
      ;(window as any).mixpanel.track(eventName, properties)
    }
  } catch (error) {
    console.warn('Failed to track event:', error)
  }
}

/**
 * Identify user
 */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined' || !analyticsInitialized) return

  try {
    if (analyticsProvider === 'posthog' && (window as any).posthog) {
      ;(window as any).posthog.identify(userId, traits)
    } else if (analyticsProvider === 'mixpanel' && (window as any).mixpanel) {
      ;(window as any).mixpanel.identify(userId)
      if (traits) {
        ;(window as any).mixpanel.people.set(traits)
      }
    }
  } catch (error) {
    console.warn('Failed to identify user:', error)
  }
}

/**
 * Reset user (on logout)
 */
export function resetUser() {
  if (typeof window === 'undefined' || !analyticsInitialized) return

  try {
    if (analyticsProvider === 'posthog' && (window as any).posthog) {
      ;(window as any).posthog.reset()
    } else if (analyticsProvider === 'mixpanel' && (window as any).mixpanel) {
      ;(window as any).mixpanel.reset()
    }
  } catch (error) {
    console.warn('Failed to reset user:', error)
  }
}
