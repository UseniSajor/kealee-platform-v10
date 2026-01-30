// LayoutShift interface for CLS measurement
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Resource timing entry interface
interface PerformanceResourceTimingEntry extends PerformanceEntry {
  initiatorType: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  private reportInterval: number = 60000; // 1 minute

  private constructor() {
    this.setupPerformanceObservers();
    this.startReporting();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObservers() {
    // Core Web Vitals observers
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.set('lcp', lastEntry.startTime);
          this.sendMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'first-input') {
              const delay = (entry as PerformanceEventTiming).processingStart - entry.startTime;
              this.metrics.set('fid', delay);
              this.sendMetric('fid', delay);
            }
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        let clsEntries: LayoutShift[] = [];

        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as LayoutShift).hadRecentInput) {
              clsEntries.push(entry as LayoutShift);
              clsValue += (entry as LayoutShift).value;
            }
          }
          this.metrics.set('cls', clsValue);
          this.sendMetric('cls', clsValue);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const fcpEntry = entries[0];
          if (fcpEntry) {
            this.metrics.set('fcp', fcpEntry.startTime);
            this.sendMetric('fcp', fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }

      // Time to First Byte (TTFB)
      try {
        const ttfbObserver = new PerformanceObserver((entryList) => {
          const navEntries = entryList.getEntriesByType('navigation');
          if (navEntries.length > 0) {
            const navEntry = navEntries[0] as PerformanceNavigationTiming;
            if (navEntry) {
              const ttfb = navEntry.responseStart - navEntry.startTime;
              this.metrics.set('ttfb', ttfb);
              this.sendMetric('ttfb', ttfb);
            }
          }
        });
        ttfbObserver.observe({ type: 'navigation', buffered: true });
        this.observers.push(ttfbObserver);
      } catch (error) {
        console.warn('TTFB observer not supported:', error);
      }
    }
  }

  private startReporting() {
    // Report metrics every minute
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.reportMetrics();
      }, this.reportInterval);
    }
  }

  private async sendMetric(name: string, value: number, tags?: Record<string, string>) {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value,
          tags: {
            page: typeof window !== 'undefined' ? window.location.pathname : '',
            ...tags
          },
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          connection: (typeof navigator !== 'undefined' && (navigator as any).connection) 
            ? (navigator as any).connection.effectiveType 
            : 'unknown'
        })
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  private async reportMetrics() {
    const metrics = Object.fromEntries(this.metrics);
    
    if (Object.keys(metrics).length > 0) {
      try {
        // Send to backend API
        await fetch('/api/performance/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics,
            page: typeof window !== 'undefined' ? window.location.pathname : '',
            timestamp: new Date().toISOString(),
            vitals: this.getCoreWebVitals()
          })
        });

        // Also send to analytics service
        if (typeof window !== 'undefined') {
          try {
            const { AnalyticsService } = await import('./analytics');
            AnalyticsService.trackWebVitals(this.getCoreWebVitals());
          } catch (importError) {
            // Analytics service might not be available, ignore
            console.debug('Analytics service not available for performance tracking');
          }
        }
      } catch (error) {
        console.error('Failed to report metrics:', error);
      }
    }
  }

  private getCoreWebVitals() {
    return {
      lcp: this.metrics.get('lcp') || 0,
      fid: this.metrics.get('fid') || 0,
      cls: this.metrics.get('cls') || 0,
      fcp: this.metrics.get('fcp') || 0,
      ttfb: this.metrics.get('ttfb') || 0,
      tti: this.calculateTTI(),
      fmp: this.calculateFMP()
    };
  }

  private calculateTTI(): number {
    // Time to Interactive calculation
    if (typeof window === 'undefined' || !performance) return 0;
    
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      if (navEntry) {
        return navEntry.domInteractive - navEntry.startTime;
      }
    }
    return 0;
  }

  private calculateFMP(): number {
    // First Meaningful Paint approximation
    if (typeof window === 'undefined' || !performance) return 0;
    
    const paintEntries = performance.getEntriesByType('paint');
    const fmpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fmpEntry ? fmpEntry.startTime : 0;
  }

  // Custom metric tracking
  static trackCustomMetric(name: string, value: number, tags?: Record<string, string>) {
    const instance = PerformanceMonitor.getInstance();
    instance.metrics.set(name, value);
    instance.sendMetric(name, value, tags);
  }

  // User timing API
  static mark(name: string) {
    if (typeof window !== 'undefined' && performance) {
      performance.mark(name);
    }
  }

  static measure(name: string, startMark: string, endMark: string) {
    if (typeof window === 'undefined' || !performance) return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      const lastMeasure = measures[measures.length - 1];
      
      if (lastMeasure) {
        PerformanceMonitor.trackCustomMetric(name, lastMeasure.duration);
      }
    } catch (error) {
      console.warn('Failed to measure:', error);
    }
  }

  // Page load timing
  static trackPageLoad() {
    if (typeof window === 'undefined') return;
    
    if (document.readyState === 'complete') {
      PerformanceMonitor.trackPageLoadTiming();
    } else {
      window.addEventListener('load', () => {
        PerformanceMonitor.trackPageLoadTiming();
      });
    }
  }

  private static trackPageLoadTiming() {
    if (typeof window === 'undefined' || !performance) return;
    
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      
      if (navEntry) {
        const timings = {
          dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcp: navEntry.connectEnd - navEntry.connectStart,
          ssl: navEntry.secureConnectionStart > 0 
            ? navEntry.connectEnd - navEntry.secureConnectionStart 
            : 0,
          ttfb: navEntry.responseStart - navEntry.startTime,
          download: navEntry.responseEnd - navEntry.responseStart,
          domInteractive: navEntry.domInteractive - navEntry.startTime,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
          load: navEntry.loadEventEnd - navEntry.startTime
        };

        Object.entries(timings).forEach(([name, value]) => {
          PerformanceMonitor.trackCustomMetric(`page_${name}`, value);
        });
      }
    }
  }

  // Resource timing
  static trackResourceTiming() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          const resourceEntry = entry as PerformanceResourceTimingEntry;
          if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
            PerformanceMonitor.trackCustomMetric(
              `resource_${resourceEntry.initiatorType}`,
              entry.duration,
              { name: entry.name }
            );
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
      
      const instance = PerformanceMonitor.getInstance();
      instance.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }
  }

  // Get current metrics
  static getMetrics() {
    const instance = PerformanceMonitor.getInstance();
    return Object.fromEntries(instance.metrics);
  }

  // Get Core Web Vitals
  static getCoreWebVitals() {
    const instance = PerformanceMonitor.getInstance();
    return instance.getCoreWebVitals();
  }

  // Cleanup
  static disconnect() {
    const instance = PerformanceMonitor.getInstance();
    instance.observers.forEach(observer => observer.disconnect());
    instance.observers = [];
  }
}

// Start monitoring on page load
if (typeof window !== 'undefined') {
  PerformanceMonitor.trackPageLoad();
  PerformanceMonitor.trackResourceTiming();
}
