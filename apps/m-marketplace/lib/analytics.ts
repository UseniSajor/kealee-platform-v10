// Unified analytics tracking for all marketing events
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    dataLayer: any[];
    hj: (...args: any[]) => void;
    _cio: any;
    _fbq?: any;
  }
}

export type EventCategory =
  | 'user_engagement'
  | 'lead_generation'
  | 'contractor_search'
  | 'service_click'
  | 'signup'
  | 'purchase'
  | 'error';

export type EventAction =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'scroll'
  | 'video_play'
  | 'download'
  | 'search'
  | 'purchase'
  | 'error_occurred'
  | 'metric';

export interface EventParams {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  [key: string]: any;
}

export class AnalyticsService {
  // Google Analytics 4
  static trackGAEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  }

  // Facebook Pixel
  static trackFacebookEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, params);
    }
  }

  // Google Tag Manager
  static trackGTMEvent(eventName: string, data: Record<string, any>) {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...data
      });
    }
  }

  // Hotjar
  static trackHotjarEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.hj) {
      window.hj('event', eventName, properties);
    }
  }

  // Customer.io
  static trackCIOEvent(eventName: string, data?: Record<string, any>) {
    if (typeof window !== 'undefined' && window._cio) {
      window._cio.track(eventName, data);
    }
  }

  // Unified event tracking
  static trackEvent(params: EventParams) {
    const { category, action, label, value, ...extraParams } = params;
    
    // Google Analytics
    this.trackGAEvent(action, {
      event_category: category,
      event_label: label,
      value: value,
      ...extraParams
    });

    // Facebook Pixel
    this.trackFacebookEvent(action, {
      content_category: category,
      content_name: label,
      value: value,
      currency: 'USD',
      ...extraParams
    });

    // Google Tag Manager
    this.trackGTMEvent(action, {
      category,
      label,
      value,
      ...extraParams
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', params);
    }
  }

  // Page view tracking
  static trackPageView(pagePath: string, pageTitle?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (gaId) {
        window.gtag('config', gaId, {
          page_path: pagePath,
          page_title: pageTitle
        });
      }
    }

    // Facebook Pixel
    this.trackFacebookEvent('PageView');

    // Hotjar virtual page view
    if (typeof window !== 'undefined' && window.hj) {
      window.hj('vpv', pagePath);
    }
  }

  // Lead generation tracking
  static trackLead(
    source: string,
    formType: string,
    leadData: {
      email?: string;
      name?: string;
      company?: string;
      phone?: string;
      service?: string;
      location?: string;
    }
  ) {
    this.trackEvent({
      category: 'lead_generation',
      action: 'form_submit',
      label: formType,
      source,
      ...leadData
    });

    // Send to CRM/webhook
    this.sendToCRM('lead_generated', {
      source,
      formType,
      ...leadData,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    });
  }

  // Contractor search tracking
  static trackContractorSearch(
    filters: {
      service?: string;
      location?: string;
      rating?: number;
      availability?: string;
      budget?: string;
    },
    resultsCount: number
  ) {
    this.trackEvent({
      category: 'contractor_search',
      action: 'search',
      label: 'contractor_search',
      value: resultsCount,
      ...filters
    });
  }

  // Service click tracking
  static trackServiceClick(
    serviceName: string,
    serviceCategory: string,
    position?: number
  ) {
    this.trackEvent({
      category: 'service_click',
      action: 'button_click',
      label: serviceName,
      service_category: serviceCategory,
      position
    });
  }

  // Signup tracking
  static trackSignup(
    planType: string,
    source: string,
    userData?: {
      email?: string;
      name?: string;
      company?: string;
    }
  ) {
    this.trackEvent({
      category: 'signup',
      action: 'form_submit',
      label: planType,
      source,
      ...userData
    });

    // Send to CRM
    this.sendToCRM('user_signup', {
      planType,
      source,
      ...userData,
      timestamp: new Date().toISOString()
    });
  }

  // Purchase tracking
  static trackPurchase(
    transactionId: string,
    amount: number,
    items: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>,
    currency: string = 'USD'
  ) {
    // Enhanced e-commerce tracking for GA
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: amount,
        currency: currency,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }

    // Facebook Pixel purchase event
    this.trackFacebookEvent('Purchase', {
      value: amount,
      currency: currency,
      content_ids: items.map(item => item.id),
      content_type: 'product',
      num_items: items.length
    });

    this.trackEvent({
      category: 'purchase',
      action: 'purchase',
      label: 'subscription_purchase',
      value: amount,
      transaction_id: transactionId,
      currency,
      items_count: items.length
    });
  }

  // Error tracking
  static trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent({
      category: 'error' as EventCategory,
      action: 'error_occurred' as EventAction,
      label: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context
    });

    // Send to error tracking service
    this.sendToErrorService(error, context);
  }

  // Performance tracking
  static trackPerformance(metricName: string, value: number, tags?: Record<string, any>) {
    this.trackEvent({
      category: 'user_engagement',
      action: 'metric' as EventAction,
      label: metricName,
      value: value,
      ...tags
    });
  }

  // Track Core Web Vitals
  static trackWebVitals(vitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    tti?: number;
    fmp?: number;
  }) {
    Object.entries(vitals).forEach(([name, value]) => {
      if (value !== undefined && value > 0) {
        this.trackPerformance(`web_vital_${name}`, value);
      }
    });
  }

  // Private helper methods
  private static async sendToCRM(event: string, data: Record<string, any>) {
    try {
      await fetch('/api/webhooks/crm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send to CRM:', error);
    }
  }

  private static async sendToErrorService(error: Error, context?: Record<string, any>) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString()
        })
      });
    } catch (fetchError) {
      console.error('Failed to send error to service:', fetchError);
    }
  }

  // Initialize all analytics services
  static initialize() {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: window.location.pathname,
        send_page_view: false
      });
    }

    // Initialize Facebook Pixel
    if (process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq = window.fbq || function() {
        (window.fbq as any).callMethod ? (window.fbq as any).callMethod.apply(window.fbq, arguments) : (window.fbq as any).queue.push(arguments);
      };
      if (!window._fbq) window._fbq = window.fbq;
      (window.fbq as any).push = window.fbq;
      (window.fbq as any).loaded = true;
      (window.fbq as any).version = '2.0';
      (window.fbq as any).queue = [];

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      window.fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID!);
      window.fbq('track', 'PageView');
    }

    // Initialize Hotjar
    if (process.env.NEXT_PUBLIC_HOTJAR_ID && process.env.NEXT_PUBLIC_HOTJAR_SV) {
      (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
        h.hj = h.hj || function() {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
        h._hjSettings = { hjid: process.env.NEXT_PUBLIC_HOTJAR_ID, hjsv: process.env.NEXT_PUBLIC_HOTJAR_SV };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
      })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }

    // Initialize Customer.io (if needed)
    // Customer.io typically loads via their script tag in the HTML
  }
}

// Initialize on page load
if (typeof window !== 'undefined') {
  AnalyticsService.initialize();
}
