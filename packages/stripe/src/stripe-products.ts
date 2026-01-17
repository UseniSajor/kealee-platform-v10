/**
 * Stripe Products Configuration
 * Complete product catalog for Kealee Platform
 * 
 * @module stripe-products
 */

/**
 * Complete Stripe Products Catalog
 * All prices are in USD
 */
export const STRIPE_PRODUCTS = {
  /**
   * PM STAFFING PACKAGES
   * Professional project management staffing services
   */
  pmStaffing: {
    packageA: {
      id: 'package_a',
      name: 'PM Staffing - Essential (Package A)',
      priceId: process.env.STRIPE_PRICE_PACKAGE_A!,
      price: 1750,
      amount: 175000, // cents
      interval: 'month' as const,
      description: 'Timeline & task management, document organization, weekly check-ins',
      features: [
        'Timeline & task management',
        'Document organization',
        'Weekly check-ins',
      ],
      metadata: {
        package_id: 'package_a',
        tier: 'essential',
        category: 'pm_staffing',
      },
    },
    packageB: {
      id: 'package_b',
      name: 'PM Staffing - Professional (Package B)',
      priceId: process.env.STRIPE_PRICE_PACKAGE_B!,
      price: 3750,
      amount: 375000, // cents
      interval: 'month' as const,
      description: 'Everything in Essential plus contractor coordination and site visits',
      features: [
        'Everything in Essential',
        'Contractor coordination',
        'Budget tracking',
        'Site visits',
      ],
      metadata: {
        package_id: 'package_b',
        tier: 'professional',
        category: 'pm_staffing',
      },
    },
    packageC: {
      id: 'package_c',
      name: 'PM Staffing - Premium (Package C)',
      priceId: process.env.STRIPE_PRICE_PACKAGE_C!,
      price: 9500,
      amount: 950000, // cents
      interval: 'month' as const,
      description: 'Everything in Professional plus permit management and full oversight',
      popular: true,
      features: [
        'Everything in Professional',
        'Permit management',
        'Inspection coordination',
        'Full contractor oversight',
      ],
      metadata: {
        package_id: 'package_c',
        tier: 'premium',
        category: 'pm_staffing',
        popular: 'true',
      },
    },
    packageD: {
      id: 'package_d',
      name: 'PM Staffing - White Glove (Package D)',
      priceId: process.env.STRIPE_PRICE_PACKAGE_D!,
      price: 16500,
      amount: 1650000, // cents
      interval: 'month' as const,
      description: 'Complete hands-off service - we handle everything',
      features: [
        'Everything in Premium',
        'We hire contractors',
        'Handle all payments',
        'Complete hands-off',
      ],
      metadata: {
        package_id: 'package_d',
        tier: 'white_glove',
        category: 'pm_staffing',
      },
    },
  },

  /**
   * MARKETPLACE SUBSCRIPTIONS
   * Contractor listing and lead generation subscriptions
   */
  marketplace: {
    basic: {
      id: 'marketplace_basic',
      name: 'Marketplace - Basic Listing',
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_BASIC!,
      price: 49,
      amount: 4900, // cents
      interval: 'month' as const,
      description: 'Basic contractor profile with limited leads',
      features: [
        'Basic profile listing',
        'Up to 5 project photos',
        'Receive up to 3 leads/month',
        'Basic analytics',
        'Community forum access',
      ],
      limits: {
        leadLimit: 3,
        photoLimit: 5,
        portfolioProjects: 3,
      },
      metadata: {
        tier: 'basic',
        lead_limit: '3',
        photo_limit: '5',
        category: 'marketplace',
      },
    },
    professional: {
      id: 'marketplace_professional',
      name: 'Marketplace - Professional',
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_PRO!,
      price: 149,
      amount: 14900, // cents
      interval: 'month' as const,
      description: 'Featured listing with priority placement',
      features: [
        'Featured profile listing',
        'Unlimited project photos & portfolio',
        'Receive up to 15 leads/month',
        'Advanced analytics & insights',
        'Priority support',
        'Verified badge',
        'Quote request notifications',
      ],
      limits: {
        leadLimit: 15,
        photoLimit: -1, // unlimited
        portfolioProjects: -1,
      },
      metadata: {
        tier: 'professional',
        lead_limit: '15',
        photo_limit: 'unlimited',
        category: 'marketplace',
        featured: 'true',
      },
    },
    premium: {
      id: 'marketplace_premium',
      name: 'Marketplace - Premium',
      priceId: process.env.STRIPE_PRICE_MARKETPLACE_PREMIUM!,
      price: 299,
      amount: 29900, // cents
      interval: 'month' as const,
      description: 'Top-tier placement with unlimited leads',
      features: [
        'Top-tier featured placement',
        'Unlimited leads & project gallery',
        'Background check verification',
        'License & insurance verification',
        'Premium badge',
        'SEO optimization',
        'Custom landing page',
        'API access for lead management',
      ],
      limits: {
        leadLimit: -1, // unlimited
        photoLimit: -1,
        portfolioProjects: -1,
      },
      metadata: {
        tier: 'premium',
        lead_limit: 'unlimited',
        photo_limit: 'unlimited',
        category: 'marketplace',
        featured: 'true',
        verified: 'true',
      },
    },
  },

  /**
   * PROFESSIONAL SUBSCRIPTIONS
   * Specialized subscriptions for professionals
   */
  professional: {
    architectPro: {
      id: 'architect_pro',
      name: 'Architect Pro Subscription',
      priceId: process.env.STRIPE_PRICE_ARCHITECT_PRO!,
      price: 99,
      amount: 9900, // cents
      interval: 'month' as const,
      description: 'Professional tools and reduced fees for architects',
      features: [
        'Unlimited project uploads',
        'Advanced BIM integration',
        'Version control & collaboration',
        'PE stamp workflow integration',
        'Priority review processing',
        'Reduced platform fees (3% instead of 5%)',
      ],
      benefits: {
        platformFeeDiscount: 2, // 2% discount
        reducedFee: 3,
        standardFee: 5,
      },
      metadata: {
        tier: 'pro',
        category: 'professional',
        profession: 'architect',
        fee_discount: '2',
      },
    },
    permitPro: {
      id: 'permit_pro',
      name: 'Permit Pro - Monthly Subscription',
      priceId: process.env.STRIPE_PRICE_PERMIT_PRO!,
      price: 299,
      amount: 29900, // cents
      interval: 'month' as const,
      description: 'Unlimited permit applications with priority processing',
      features: [
        'Unlimited permit applications',
        'Priority processing',
        'Automated compliance checks',
        'Jurisdiction integration',
        'Real-time status tracking',
        'Inspection scheduling included',
      ],
      limits: {
        permitApplications: -1, // unlimited
        priorityProcessing: true,
      },
      metadata: {
        tier: 'pro',
        category: 'professional',
        service: 'permits',
        applications: 'unlimited',
      },
    },
  },

  /**
   * MARKETING PACKAGE (NEW)
   * Complete marketing suite for contractors
   */
  marketing: {
    pro: {
      id: 'marketing_pro',
      name: 'Marketing Pro Package',
      priceId: process.env.STRIPE_PRICE_MARKETING_PRO!,
      price: 799,
      amount: 79900, // cents
      interval: 'month' as const,
      description: 'Complete marketing suite with website, SEO, and ad management',
      features: [
        'Custom website builder',
        'SEO optimization',
        'Google Ads management ($500 budget included)',
        'Social media automation (20 posts/month)',
        'Lead generation tools',
        'Monthly performance reports',
        'Email marketing campaigns',
        'Review management system',
      ],
      included: {
        websiteBuilder: true,
        googleAdsBudget: 500,
        socialPostsPerMonth: 20,
        emailCampaigns: true,
        seoOptimization: true,
        reviewManagement: true,
      },
      metadata: {
        tier: 'pro',
        category: 'marketing',
        google_ads_budget: '500',
        social_posts_monthly: '20',
        website_included: 'true',
      },
    },
  },

  /**
   * ADD-ON SERVICES
   * One-time and recurring add-on services
   */
  addOns: {
    expedited: {
      id: 'expedited_processing',
      name: 'Expedited Processing - 24hr Rush',
      priceId: process.env.STRIPE_PRICE_EXPEDITED!,
      price: 500,
      amount: 50000, // cents
      type: 'one_time' as const,
      description: '24-hour rush service for urgent requests',
      features: [
        '24-hour guaranteed processing',
        'Priority queue placement',
        'Dedicated support contact',
        'Weekend & holiday processing',
      ],
      metadata: {
        type: 'one_time',
        category: 'add_on',
        service: 'expedited',
        turnaround: '24_hours',
      },
    },
    whiteLabel: {
      id: 'white_label',
      name: 'White-Label Reporting',
      priceId: process.env.STRIPE_PRICE_WHITE_LABEL!,
      price: 199,
      amount: 19900, // cents
      interval: 'month' as const,
      description: 'Custom branded reports for client delivery',
      features: [
        'Custom branded reports for clients',
        'Remove Kealee branding',
        'Custom logo and colors',
        'Client-facing dashboards',
      ],
      metadata: {
        tier: 'standard',
        category: 'add_on',
        service: 'white_label',
      },
    },
    apiAccess: {
      id: 'api_access',
      name: 'API Access - Professional',
      priceId: process.env.STRIPE_PRICE_API_ACCESS!,
      price: 499,
      amount: 49900, // cents
      interval: 'month' as const,
      description: 'Full API access with high rate limits',
      features: [
        'Full REST API access',
        'GraphQL endpoint access',
        'Webhook support',
        'Rate limit: 10,000 requests/day',
        'Dedicated API support',
      ],
      limits: {
        requestsPerDay: 10000,
        webhooks: true,
      },
      metadata: {
        tier: 'professional',
        category: 'add_on',
        service: 'api',
        rate_limit: '10000',
      },
    },
  },

  /**
   * PAY-PER-PERMIT SERVICES
   * One-time permit processing fees
   */
  permits: {
    simple: {
      id: 'permit_simple',
      name: 'Simple Permit Processing',
      priceId: process.env.STRIPE_PRICE_PERMIT_SIMPLE!,
      price: 50,
      amount: 5000, // cents
      type: 'one_time' as const,
      description: 'Basic permit applications (fence, deck, minor repairs)',
      features: [
        'Basic permit application',
        'Standard processing time (10-15 business days)',
        'Document preparation',
        'Submission to jurisdiction',
        'Status updates',
      ],
      processingTime: {
        min: 10,
        max: 15,
        unit: 'business_days',
      },
      metadata: {
        type: 'one_time',
        category: 'permit',
        complexity: 'simple',
        processing_days: '10-15',
      },
    },
    standard: {
      id: 'permit_standard',
      name: 'Standard Permit Processing',
      priceId: process.env.STRIPE_PRICE_PERMIT_STANDARD!,
      price: 150,
      amount: 15000, // cents
      type: 'one_time' as const,
      description: 'Typical residential/commercial permits',
      features: [
        'Standard permit application',
        'Processing time (15-30 business days)',
        'Document preparation & review',
        'Submission & follow-up',
        'Inspection coordination',
        'Regular status updates',
      ],
      processingTime: {
        min: 15,
        max: 30,
        unit: 'business_days',
      },
      metadata: {
        type: 'one_time',
        category: 'permit',
        complexity: 'standard',
        processing_days: '15-30',
      },
    },
    complex: {
      id: 'permit_complex',
      name: 'Complex Permit Processing',
      priceId: process.env.STRIPE_PRICE_PERMIT_COMPLEX!,
      price: 500,
      amount: 50000, // cents
      type: 'one_time' as const,
      description: 'Major construction and complex projects',
      features: [
        'Complex permit application',
        'Expedited processing (7-20 business days)',
        'Comprehensive document preparation',
        'Architectural/engineering coordination',
        'Multiple jurisdiction submissions',
        'Full inspection coordination',
        'Dedicated permit specialist',
        'Priority support',
      ],
      processingTime: {
        min: 7,
        max: 20,
        unit: 'business_days',
      },
      metadata: {
        type: 'one_time',
        category: 'permit',
        complexity: 'complex',
        processing_days: '7-20',
        dedicated_specialist: 'true',
      },
    },
  },

  /**
   * TRANSACTION FEES
   * Platform transaction fee structures
   */
  transactionFees: {
    standard: {
      id: 'standard_transaction',
      name: 'Standard Transaction Fee',
      percentage: 3.5,
      fixed: 0.30,
      description: 'Standard platform fee for transactions',
      metadata: {
        type: 'transaction_fee',
        category: 'standard',
      },
    },
    milestone: {
      id: 'milestone_payment',
      name: 'Milestone Payment Fee',
      percentage: 2.9,
      fixed: 0.30,
      description: 'Fee for milestone-based payments',
      metadata: {
        type: 'transaction_fee',
        category: 'milestone',
      },
    },
    architect: {
      id: 'architect_platform_fee',
      name: 'Architect Platform Fee',
      percentage: 5.0,
      minimum: 500,
      description: 'Platform fee for architect services',
      metadata: {
        type: 'transaction_fee',
        category: 'architect',
        minimum: '500',
      },
    },
    architectPro: {
      id: 'architect_pro_fee',
      name: 'Architect Pro Platform Fee (Reduced)',
      percentage: 3.0,
      minimum: 500,
      description: 'Reduced fee for Architect Pro subscribers',
      metadata: {
        type: 'transaction_fee',
        category: 'architect_pro',
        minimum: '500',
        reduced: 'true',
      },
    },
    escrow: {
      id: 'escrow_fee',
      name: 'Escrow Processing Fee',
      percentage: 1.0,
      maximum: 500,
      description: 'Fee for escrow-held payments',
      metadata: {
        type: 'transaction_fee',
        category: 'escrow',
        maximum: '500',
      },
    },
  },
} as const;

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = {
  PM_STAFFING: 'pm_staffing',
  MARKETPLACE: 'marketplace',
  PROFESSIONAL: 'professional',
  MARKETING: 'marketing',
  ADD_ONS: 'add_ons',
  PERMITS: 'permits',
  TRANSACTION_FEES: 'transaction_fees',
} as const;

/**
 * Subscription Intervals
 */
export const INTERVALS = {
  MONTH: 'month',
  YEAR: 'year',
} as const;

/**
 * Product Types
 */
export const PRODUCT_TYPES = {
  RECURRING: 'recurring',
  ONE_TIME: 'one_time',
} as const;
