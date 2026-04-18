/**
 * packages/shared/src/pricing.ts
 *
 * Centralized pricing configuration
 * Single source of truth for all service pricing across frontend and backend
 * Used by: web-main, estimation routes, frontend components
 */

export const SERVICE_PRICING = {
  // ESTIMATION SERVICES
  estimation: {
    cost_estimate: {
      name: 'Detailed Cost Estimate',
      amount: 59500, // cents
      amountUsd: 595,
      turnaround: 3, // business days
      description: 'Human-reviewed, trade-by-trade breakdown validated against RSMeans',
      features: [
        'CSI MasterFormat line-item breakdown',
        'RSMeans unit cost validation',
        'Base / mid / high scenarios',
        'Licensed estimator sign-off',
        'Lender-ready PDF',
      ],
    },
    certified_estimate: {
      name: 'Certified Cost Estimate',
      amount: 185000, // cents
      amountUsd: 1850,
      turnaround: 5,
      description: 'Notarized licensed estimator sign-off, full RSMeans source documentation',
      features: [
        'Everything in Detailed Estimate',
        'Notarized licensed estimator signature',
        'Full RSMeans source citations',
        'Investor-grade executive summary',
        'Excel + PDF deliverable',
      ],
    },
    bundle: {
      name: 'Estimate + Permit Bundle',
      amount: 110000, // cents
      amountUsd: 1100,
      turnaround: 5,
      description: 'Detailed cost estimate plus permit package preparation — bundled for efficiency',
      features: [
        'Full Detailed Cost Estimate',
        'Permit package preparation',
        'Submission to correct agency',
        'Bundle savings vs. individual',
        'Single project intake',
      ],
    },
  },

  // PERMIT SERVICES
  permits: {
    document_assembly: {
      name: 'Document Assembly',
      amount: 49500, // cents
      amountUsd: 495,
      description: 'DIY permit application with our document templates',
      features: [
        'Jurisdiction-specific forms',
        'Document templates',
        'Email support',
        'Self-submission',
      ],
      submissionMethods: {
        SELF: 1.0, // -20% discount built into base price
      },
    },
    simple_permit: {
      name: 'Simple Permit',
      amount: 79500, // cents
      amountUsd: 795,
      description: 'Basic residential permit preparation and submission',
      features: [
        'Single permit type',
        'Application preparation',
        'Agency submission',
        'Status updates',
      ],
      submissionMethods: {
        SELF: 0.8, // -20% discount
        ASSISTED: 1.0, // standard
      },
    },
    complex_permit: {
      name: 'Complex Permit',
      amount: 149500, // cents
      amountUsd: 1495,
      description: 'Multi-permit coordination, structural or engineering components',
      features: [
        'Multiple permit coordination',
        'Engineering liaison',
        'Expedited processing',
        'Unlimited revisions',
      ],
      submissionMethods: {
        ASSISTED: 1.0,
        KEALEE_MANAGED: 1.3, // +30% premium
      },
    },
    expedited: {
      name: 'Expedited Permit Processing',
      amount: 249500, // cents
      amountUsd: 2495,
      description: 'Priority processing with expedited timeline',
      features: [
        'Priority processing',
        ' 5-day turnaround',
        'Dedicated project manager',
        'Direct agency contact',
        'Unlimited support',
      ],
      submissionMethods: {
        KEALEE_MANAGED: 1.0, // premium price is base
      },
    },
  },

  // DESIGN SERVICES
  preDesign: {
    starter: {
      name: 'Concept Package — Starter',
      amount: 29500, // cents
      amountUsd: 295,
      description: 'AI-generated concept design with basic visualization',
    },
    visualization: {
      name: 'Concept Package — Visualization',
      amount: 59500, // cents
      amountUsd: 595,
      description: 'Photorealistic renderings and detailed design concept',
    },
    preDesign: {
      name: 'Pre-Design Package',
      amount: 99500, // cents
      amountUsd: 995,
      description: 'Complete pre-design with zoning, buildability, and cost framework',
    },
  },

  // CONTRACTOR MATCH
  contractorMatch: {
    name: 'Contractor Matching Service',
    amount: 19900, // cents
    amountUsd: 199,
    description: 'Connect with verified contractors for your project',
    features: [
      'Profile-based matching',
      'Verified credentials',
      'Reference checks',
      'Insurance verification',
    ],
  },

  // ARCHITECT/DESIGNER CONSULTATION
  architectConsultation: {
    name: 'Architect Consultation',
    amount: 14900, // cents
    amountUsd: 149,
    description: 'Expert guidance and project review',
    features: [
      '1-hour consultation call',
      'Design review',
      'Feasibility assessment',
      'Permit pathway guidance',
    ],
  },
} as const

/**
 * Helper functions for pricing display
 */
export function formatPrice(cents: number, format: 'usd' | 'display' = 'display'): string {
  const dollars = cents / 100
  if (format === 'usd') return dollars.toFixed(2)
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`
  }
  return `$${dollars.toFixed(0)}`
}

export function getStartingPrice(service: keyof typeof SERVICE_PRICING): number {
  const serviceCategory = SERVICE_PRICING[service]
  if (typeof serviceCategory === 'object' && !('amount' in serviceCategory)) {
    // Category with multiple tiers, get the minimum
    const prices = Object.values(serviceCategory as Record<string, any>)
      .filter(item => 'amount' in item)
      .map(item => (item as any).amount)
    return Math.min(...prices)
  }
  return (serviceCategory as any).amount
}

export function getDisplayPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

/**
 * Permit submission method multipliers
 * Applied to base permit price based on submission method
 */
export const PERMIT_SUBMISSION_MULTIPLIERS = {
  SELF: 0.8, // -20% discount for self-submission
  ASSISTED: 1.0, // standard price
  KEALEE_MANAGED: 1.3, // +30% premium for full service
} as const

/**
 * Type exports for convenience
 */
export type ServiceCategory = keyof typeof SERVICE_PRICING
export type SubmissionMethod = keyof typeof PERMIT_SUBMISSION_MULTIPLIERS
