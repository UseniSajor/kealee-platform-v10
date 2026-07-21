/**
 * Performance Monitoring
 * Tracks Core Web Vitals and performance metrics
 */

export interface PerformanceMetrics {
  pageLoadTime?: number
  timeToFirstByte?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
  totalBlockingTime?: number
}

let metrics: PerformanceMetrics = {}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return

  // Track page load time
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      const timing = window.performance.timing
      metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart
      metrics.timeToFirstByte = timing.responseStart - timing.navigationStart

      // Send to analytics
      trackPerformanceMetrics(metrics)
    })
  }

  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime
        trackPerformanceMetrics(metrics)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstInput = entries[0] as any
        metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime
        trackPerformanceMetrics(metrics)
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        metrics.cumulativeLayoutShift = clsValue
        trackPerformanceMetrics(metrics)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch {
      // CLS not supported
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries.find((entry) => entry.name === 'first-contentful-paint')
        if (fcp) {
          metrics.firstContentfulPaint = fcp.startTime
          trackPerformanceMetrics(metrics)
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch {
      // FCP not supported
    }
  }
}

/**
 * Track performance metrics
 */
function trackPerformanceMetrics(metrics: PerformanceMetrics) {
  // Send to analytics
  if (typeof window !== 'undefined') {
    const { trackEvent } = require('./analytics')
    trackEvent('Performance Metrics', metrics)

    // Send to API for storage
    if (process.env.NEXT_PUBLIC_API_URL) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Ignore errors
      })
    }
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics }
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const startTime = performance.now()
  const result = fn()
  const endTime = performance.now()
  const duration = endTime - startTime

  console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)

  // Track to analytics
  if (typeof window !== 'undefined') {
    const { trackEvent } = require('./analytics')
    trackEvent('Performance Measurement', {
      name,
      duration,
    })
  }

  return result
}

/**
 * Measure async function execution time
 */
export async function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startTime = performance.now()
  const result = await fn()
  const endTime = performance.now()
  const duration = endTime - startTime

  console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)

  // Track to analytics
  if (typeof window !== 'undefined') {
    const { trackEvent } = require('./analytics')
    trackEvent('Performance Measurement', {
      name,
      duration,
    })
  }

  return result
}
