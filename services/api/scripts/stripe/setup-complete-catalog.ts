import Stripe from 'stripe'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file if it exists
config({ path: resolve(process.cwd(), '.env.local') })

// Environment variable helper
function env(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

interface PackageProduct {
  slug: string
  name: string
  description: string
  price: number // in dollars
  annualPrice?: number // optional annual price with discount
  interval: 'month' | 'year' | 'one_time'
  features: string[]
  metadata: Record<string, string>
  statementDescriptor: string
  taxCode?: string
}

interface ALaCarteProduct {
  slug: string
  name: string
  description: string
  price: number // in dollars
  priceRange?: { min: number; max: number }
  interval: 'one_time' | 'month'
  metadata: Record<string, string>
  statementDescriptor: string
  taxCode?: string
}

const PRODUCTS = {
  // PM Packages (recurring monthly/yearly)
  pmPackages: [
    {
      slug: 'pm-package-a',
      name: 'PM Package A - Starter',
      description: '5-10 hours/week of professional project management. Perfect for small projects and getting started with professional oversight.',
      price: 1750,
      annualPrice: 1750 * 12 * 0.85, // 15% discount
      interval: 'month' as const,
      features: [
        '5-10 hours/week PM time',
        'Single project focus',
        'Email support (48hr response)',
        'Weekly progress reports',
        'Basic task tracking',
        'Contractor coordination',
        'Budget monitoring'
      ],
      metadata: {
        category: 'pm',
        package_tier: 'A',
        hours_per_week: '5-10',
        project_limit: '1',
        support_level: 'standard'
      },
      statementDescriptor: 'KEALEE PM-A',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'pm-package-b',
      name: 'PM Package B - Professional',
      description: '15-20 hours/week of professional project management. Ideal for growing projects requiring consistent oversight and coordination.',
      price: 4500,
      annualPrice: 4500 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        '15-20 hours/week PM time',
        'Up to 3 concurrent projects',
        'Priority email & phone support',
        'Bi-weekly progress reports',
        'Advanced project tracking',
        'Full contractor coordination',
        'Budget optimization',
        'Risk management'
      ],
      metadata: {
        category: 'pm',
        package_tier: 'B',
        hours_per_week: '15-20',
        project_limit: '3',
        support_level: 'priority',
        popular: 'true'
      },
      statementDescriptor: 'KEALEE PM-B',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'pm-package-c',
      name: 'PM Package C - Premium',
      description: '30-40 hours/week of dedicated project management. Comprehensive support for complex projects with full-service oversight.',
      price: 8500,
      annualPrice: 8500 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        '30-40 hours/week PM time',
        'Unlimited projects',
        '24/7 priority support',
        'Daily progress reports',
        'Dedicated PM assigned',
        'Full contractor management',
        'Budget optimization & forecasting',
        'Advanced risk management',
        'Quality control inspections',
        'Owner representation at meetings'
      ],
      metadata: {
        category: 'pm',
        package_tier: 'C',
        hours_per_week: '30-40',
        project_limit: 'unlimited',
        support_level: 'premium',
        dedicated_pm: 'true'
      },
      statementDescriptor: 'KEALEE PM-C',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'pm-package-d',
      name: 'PM Package D - Enterprise',
      description: '40+ hours/week of enterprise-level project management. White-glove service for portfolio management and strategic oversight.',
      price: 16500,
      annualPrice: 16500 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        '40+ hours/week PM time',
        'Portfolio management',
        'Dedicated account manager',
        'Custom reporting & analytics',
        'Strategic planning support',
        'Multi-project coordination',
        'Executive-level insights',
        'White-glove service',
        'Custom integrations',
        'On-site visits included'
      ],
      metadata: {
        category: 'pm',
        package_tier: 'D',
        hours_per_week: '40+',
        project_limit: 'unlimited',
        support_level: 'enterprise',
        dedicated_pm: 'true',
        account_manager: 'true'
      },
      statementDescriptor: 'KEALEE PM-D',
      taxCode: 'txcd_10301000'
    }
  ],

  // Architecture Packages (one-time)
  architecturePackages: [
    {
      slug: 'arch-package-a',
      name: 'Architecture Package A - Design Consultation',
      description: 'Professional architectural consultation for small projects. Includes conceptual design, space planning, and basic drawings.',
      price: 2500,
      interval: 'one_time' as const,
      features: [
        'Initial consultation (2 hours)',
        'Site analysis',
        'Conceptual design (1-2 options)',
        'Basic floor plans',
        'Preliminary budget estimate',
        '1 revision round',
        'Digital delivery'
      ],
      metadata: {
        category: 'architecture',
        package_tier: 'A',
        project_size: 'small',
        square_footage: 'up to 1,500',
        revisions: '1',
        includes_stamping: 'false'
      },
      statementDescriptor: 'KEALEE ARCH-A',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'arch-package-b',
      name: 'Architecture Package B - Residential Design',
      description: 'Complete residential design package including architectural drawings, 3D renderings, and permit-ready plans.',
      price: 7500,
      interval: 'one_time' as const,
      features: [
        'Comprehensive site analysis',
        'Conceptual design (3-4 options)',
        'Detailed floor plans',
        'Elevations & sections',
        '3D renderings (3 views)',
        'Material selections',
        'Permit-ready drawings',
        'PE/Architect stamp',
        '2 revision rounds'
      ],
      metadata: {
        category: 'architecture',
        package_tier: 'B',
        project_size: 'medium',
        square_footage: '1,500-3,500',
        revisions: '2',
        includes_stamping: 'true',
        popular: 'true'
      },
      statementDescriptor: 'KEALEE ARCH-B',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'arch-package-c',
      name: 'Architecture Package C - Full Service Design',
      description: 'Comprehensive architectural services from concept through construction administration. Perfect for custom homes and renovations.',
      price: 15000,
      interval: 'one_time' as const,
      features: [
        'Full design development',
        'Detailed construction documents',
        'Structural engineering coordination',
        'MEP coordination',
        'Specifications & details',
        'Multiple 3D renderings',
        'Interior design consultation',
        'Permit application support',
        'Construction administration (limited)',
        '3 revision rounds'
      ],
      metadata: {
        category: 'architecture',
        package_tier: 'C',
        project_size: 'large',
        square_footage: '3,500-6,000',
        revisions: '3',
        includes_stamping: 'true',
        includes_engineering: 'true',
        includes_ca: 'true'
      },
      statementDescriptor: 'KEALEE ARCH-C',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'arch-package-d',
      name: 'Architecture Package D - Premium Custom Design',
      description: 'Luxury architectural services with full design team. Includes all disciplines, unlimited revisions, and comprehensive construction administration.',
      price: 35000,
      interval: 'one_time' as const,
      features: [
        'Dedicated design team',
        'Luxury home specialization',
        'Complete design development',
        'Full construction documents',
        'Structural & MEP engineering',
        'Landscape architecture',
        'Interior architecture',
        'Custom specifications',
        'Unlimited revisions',
        'Full construction administration',
        'Site visits & inspections',
        'As-built documentation'
      ],
      metadata: {
        category: 'architecture',
        package_tier: 'D',
        project_size: 'custom',
        square_footage: '6,000+',
        revisions: 'unlimited',
        includes_stamping: 'true',
        includes_engineering: 'true',
        includes_ca: 'true',
        includes_landscape: 'true',
        includes_interior: 'true'
      },
      statementDescriptor: 'KEALEE ARCH-D',
      taxCode: 'txcd_10301000'
    }
  ],

  // Project Owner Packages (recurring monthly/yearly)
  projectOwnerPackages: [
    {
      slug: 'po-package-a',
      name: 'Project Owner Package A - Essential',
      description: 'Essential tools for project owners managing their own projects with basic oversight and tracking.',
      price: 299,
      annualPrice: 299 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Project dashboard access',
        'Basic project tracking',
        'Document storage (10GB)',
        'Contractor directory',
        'Email support',
        'Monthly reports',
        'Payment tracking',
        'Photo storage'
      ],
      metadata: {
        category: 'project_owner',
        package_tier: 'A',
        storage_gb: '10',
        support_level: 'email'
      },
      statementDescriptor: 'KEALEE PO-A',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'po-package-b',
      name: 'Project Owner Package B - Professional',
      description: 'Professional tools for active project owners with advanced tracking, reporting, and coordination features.',
      price: 699,
      annualPrice: 699 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Advanced project dashboard',
        'Real-time project tracking',
        'Document storage (100GB)',
        'Full contractor network access',
        'Priority email & chat support',
        'Bi-weekly reports',
        'Payment processing integration',
        'Unlimited photo storage',
        'Budget management tools',
        'Timeline & scheduling'
      ],
      metadata: {
        category: 'project_owner',
        package_tier: 'B',
        storage_gb: '100',
        support_level: 'priority',
        popular: 'true'
      },
      statementDescriptor: 'KEALEE PO-B',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'po-package-c',
      name: 'Project Owner Package C - Premium',
      description: 'Premium platform access with AI insights, advanced analytics, and dedicated support for portfolio management.',
      price: 1499,
      annualPrice: 1499 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Premium dashboard & analytics',
        'AI-powered insights',
        'Unlimited document storage',
        'Priority contractor matching',
        'Dedicated account manager',
        'Weekly reports & insights',
        'Payment processing',
        'Unlimited storage',
        'Advanced budget & forecasting',
        'Portfolio management',
        'Custom reporting',
        'API access'
      ],
      metadata: {
        category: 'project_owner',
        package_tier: 'C',
        storage_gb: 'unlimited',
        support_level: 'dedicated',
        dedicated_manager: 'true'
      },
      statementDescriptor: 'KEALEE PO-C',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'po-package-d',
      name: 'Project Owner Package D - Enterprise',
      description: 'Enterprise platform with white-glove service, custom integrations, and unlimited everything for large portfolios.',
      price: 2999,
      annualPrice: 2999 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Enterprise dashboard & analytics',
        'AI-powered portfolio optimization',
        'Unlimited everything',
        'VIP contractor access',
        'Dedicated enterprise team',
        'Custom reporting & dashboards',
        'White-glove onboarding',
        'Custom integrations',
        'SLA guarantees',
        'On-site training',
        'Unlimited API access',
        'Dedicated infrastructure'
      ],
      metadata: {
        category: 'project_owner',
        package_tier: 'D',
        storage_gb: 'unlimited',
        support_level: 'enterprise',
        dedicated_manager: 'true',
        enterprise_team: 'true'
      },
      statementDescriptor: 'KEALEE PO-D',
      taxCode: 'txcd_10301000'
    }
  ],

  // Permit & Inspection Packages (recurring monthly/yearly)
  permitPackages: [
    {
      slug: 'permit-package-a',
      name: 'Permit & Inspection Package A - Basic',
      description: 'Basic permit application support and inspection scheduling for simple projects.',
      price: 499,
      annualPrice: 499 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Permit application assistance',
        'Document preparation',
        'Inspection scheduling',
        'Basic compliance checking',
        'Email support',
        'Up to 2 permits/month',
        'Inspection reminders'
      ],
      metadata: {
        category: 'permits',
        package_tier: 'A',
        permit_limit: '2',
        support_level: 'email'
      },
      statementDescriptor: 'KEALEE PERMIT-A',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'permit-package-b',
      name: 'Permit & Inspection Package B - Standard',
      description: 'Standard permit management with AI review, resubmittal support, and priority scheduling.',
      price: 1299,
      annualPrice: 1299 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Full permit application support',
        'AI-powered document review',
        'Resubmittal management',
        'Priority inspection scheduling',
        'Compliance monitoring',
        'Priority support',
        'Up to 5 permits/month',
        'Inspection coordination',
        'Jurisdiction communication',
        'Status tracking'
      ],
      metadata: {
        category: 'permits',
        package_tier: 'B',
        permit_limit: '5',
        support_level: 'priority',
        ai_review: 'true',
        popular: 'true'
      },
      statementDescriptor: 'KEALEE PERMIT-B',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'permit-package-c',
      name: 'Permit & Inspection Package C - Professional',
      description: 'Professional permit management with dedicated support, unlimited permits, and full-service coordination.',
      price: 2499,
      annualPrice: 2499 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Unlimited permit applications',
        'AI-powered review & optimization',
        'Full resubmittal management',
        'Guaranteed inspection scheduling',
        'Proactive compliance monitoring',
        'Dedicated permit specialist',
        'Priority support',
        'Full jurisdiction coordination',
        'Real-time status updates',
        'Compliance reporting',
        'Document management'
      ],
      metadata: {
        category: 'permits',
        package_tier: 'C',
        permit_limit: 'unlimited',
        support_level: 'dedicated',
        ai_review: 'true',
        dedicated_specialist: 'true'
      },
      statementDescriptor: 'KEALEE PERMIT-C',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'permit-package-d',
      name: 'Permit & Inspection Package D - Enterprise',
      description: 'Enterprise permit management with white-glove service, custom workflows, and portfolio management.',
      price: 4999,
      annualPrice: 4999 * 12 * 0.85,
      interval: 'month' as const,
      features: [
        'Unlimited everything',
        'AI-powered optimization',
        'White-glove service',
        'Dedicated permit team',
        'Custom workflows',
        'Portfolio permit management',
        'Advanced analytics & reporting',
        'API integrations',
        'SLA guarantees',
        'On-site coordination',
        'Custom compliance rules'
      ],
      metadata: {
        category: 'permits',
        package_tier: 'D',
        permit_limit: 'unlimited',
        support_level: 'enterprise',
        ai_review: 'true',
        dedicated_specialist: 'true',
        enterprise_team: 'true'
      },
      statementDescriptor: 'KEALEE PERMIT-D',
      taxCode: 'txcd_10301000'
    }
  ],

  // Ops Services A La Carte (from existing setup-ops-products.ts)
  opsALaCarte: [
    {
      slug: 'permit-application-help',
      name: 'Permit Application Help',
      description: 'Applications, resubmittals, follow-ups, jurisdiction communications',
      price: 300,
      priceRange: { min: 150, max: 500 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-PERMIT',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'inspection-scheduling',
      name: 'Inspection Scheduling',
      description: 'Coordinate and schedule all required inspections',
      price: 200,
      priceRange: { min: 100, max: 300 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-INSPECT',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'document-organization',
      name: 'Document Organization',
      description: 'Organize and digitize project documents',
      price: 400,
      priceRange: { min: 200, max: 600 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-DOCS',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'contractor-coordination',
      name: 'Contractor Coordination',
      description: 'Coordinate multiple contractors and trades',
      price: 500,
      priceRange: { min: 300, max: 800 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-COORD',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'site-visits',
      name: 'Site Visits',
      description: 'Professional on-site project visits and inspections',
      price: 350,
      priceRange: { min: 200, max: 500 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-VISIT',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'budget-analysis',
      name: 'Budget Analysis',
      description: 'Detailed budget review and cost optimization',
      price: 450,
      priceRange: { min: 250, max: 700 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-BUDGET',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'progress-reporting',
      name: 'Progress Reporting',
      description: 'Custom progress reports and project updates',
      price: 250,
      priceRange: { min: 150, max: 400 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-REPORT',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'quality-control',
      name: 'Quality Control Inspection',
      description: 'Professional quality control inspections and punch lists',
      price: 400,
      priceRange: { min: 250, max: 600 },
      interval: 'one_time' as const,
      metadata: {
        category: 'ops',
        product_type: 'a-la-carte',
        audience: 'gc'
      },
      statementDescriptor: 'KEALEE OPS-QC',
      taxCode: 'txcd_10301000'
    }
  ],

  // Estimation Services (one-time)
  estimationServices: [
    {
      slug: 'estimation-basic',
      name: 'Basic Project Estimation',
      description: 'Quick estimate for small projects with basic material and labor costs',
      price: 299,
      interval: 'one_time' as const,
      features: [
        'Basic material cost estimate',
        'Labor cost estimate',
        'Single revision',
        'Digital delivery'
      ],
      metadata: {
        category: 'estimation',
        service_tier: 'basic',
        project_size: 'small'
      },
      statementDescriptor: 'KEALEE EST-BASIC',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'estimation-standard',
      name: 'Standard Project Estimation',
      description: 'Comprehensive estimate with detailed breakdown, material specifications, and timeline',
      price: 799,
      interval: 'one_time' as const,
      features: [
        'Detailed cost breakdown',
        'Material specifications',
        'Labor estimates by trade',
        'Timeline estimate',
        '2 revisions',
        'PDF & Excel delivery'
      ],
      metadata: {
        category: 'estimation',
        service_tier: 'standard',
        project_size: 'medium',
        popular: 'true'
      },
      statementDescriptor: 'KEALEE EST-STD',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'estimation-premium',
      name: 'Premium Project Estimation',
      description: 'Professional estimate with AI-powered analysis, value engineering, and multiple scenarios',
      price: 1999,
      interval: 'one_time' as const,
      features: [
        'AI-powered cost analysis',
        'Detailed material specs',
        'Labor estimates by trade & phase',
        'Timeline with dependencies',
        'Value engineering suggestions',
        'Multiple scenario options',
        'Unlimited revisions',
        'Professional presentation',
        'Consultation included'
      ],
      metadata: {
        category: 'estimation',
        service_tier: 'premium',
        project_size: 'large',
        ai_powered: 'true'
      },
      statementDescriptor: 'KEALEE EST-PREM',
      taxCode: 'txcd_10301000'
    },
    {
      slug: 'estimation-enterprise',
      name: 'Enterprise Project Estimation',
      description: 'Enterprise-grade estimation with custom models, historical data analysis, and portfolio optimization',
      price: 4999,
      interval: 'one_time' as const,
      features: [
        'Custom estimation models',
        'Historical data analysis',
        'Portfolio optimization',
        'Risk analysis',
        'Budget forecasting',
        'Multiple scenarios',
        'Unlimited revisions',
        'Dedicated estimator',
        'Custom reporting',
        'Ongoing support'
      ],
      metadata: {
        category: 'estimation',
        service_tier: 'enterprise',
        project_size: 'portfolio',
        ai_powered: 'true',
        dedicated_estimator: 'true'
      },
      statementDescriptor: 'KEALEE EST-ENT',
      taxCode: 'txcd_10301000'
    }
  ]
}

// Helper function to filter out undefined values from metadata
function filterMetadata(metadata: Record<string, string | undefined>): Record<string, string> {
  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      filtered[key] = value
    }
  }
  return filtered
}

async function upsertProduct(
  stripe: Stripe,
  params: { name: string; description: string; metadata: Record<string, string>; statementDescriptor?: string; taxCode?: string }
): Promise<Stripe.Product> {
  const existing = await stripe.products.list({ limit: 100 })
  const found = existing.data.find((p: Stripe.Product) => p.metadata.slug === params.metadata.slug)

  if (found) {
    console.log(`  Updating existing product: ${found.id}`)
    return await stripe.products.update(found.id, {
      name: params.name,
      description: params.description,
      metadata: params.metadata,
      statement_descriptor: params.statementDescriptor,
      tax_code: params.taxCode
    })
  }

  return await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: {
      ...params.metadata,
      slug: params.metadata.slug || ''
    },
    statement_descriptor: params.statementDescriptor,
    tax_code: params.taxCode
  })
}

async function upsertPrice(
  stripe: Stripe,
  params: { productId: string; lookupKey: string; unitAmount: number; interval?: 'month' | 'year' | 'one_time' }
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({ limit: 100 })
  const found = existing.data.find((p: Stripe.Price) => p.lookup_key === params.lookupKey)

  if (found) {
    // Check if the existing price matches what we want
    const amountMatches = found.unit_amount === params.unitAmount
    const intervalMatches = 
      params.interval === 'one_time' 
        ? !found.recurring 
        : found.recurring?.interval === params.interval

    if (amountMatches && intervalMatches) {
      console.log(`  Using existing price: ${found.id}`)
      // Just ensure it's active
      if (!found.active) {
        return await stripe.prices.update(found.id, { active: true })
      }
      return found
    } else {
      // Price exists but doesn't match - create new one with different lookup key
      console.log(`  ⚠️  Existing price doesn't match, creating new price...`)
      // Continue to create new price below
    }
  }

  const priceParams: Stripe.PriceCreateParams = {
    product: params.productId,
    unit_amount: params.unitAmount,
    currency: 'usd',
    lookup_key: params.lookupKey,
    active: true
  }

  if (params.interval && params.interval !== 'one_time') {
    priceParams.recurring = {
      interval: params.interval === 'month' ? 'month' : 'year'
    }
  }

  return await stripe.prices.create(priceParams)
}

async function main() {
  console.log('🚀 Setting up Complete Kealee Platform Product Catalog...\n')

  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-12-15.clover' as any
  })

  const output: Record<string, string> = {}

  // Process PM Packages
  console.log('📦 Creating PM Packages...\n')
  for (const pkg of PRODUCTS.pmPackages) {
    console.log(`Processing ${pkg.name}...`)
    const product = await upsertProduct(stripe, {
      name: pkg.name,
      description: `${pkg.description}\n\nFeatures:\n${pkg.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: filterMetadata({ ...pkg.metadata, slug: pkg.slug }),
      statementDescriptor: pkg.statementDescriptor,
      taxCode: pkg.taxCode
    })

    const monthlyLookupKey = `pm-${pkg.slug}-month`
    const monthlyPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: monthlyLookupKey,
      unitAmount: Math.round(pkg.price * 100),
      interval: 'month'
    })

    let annualPrice: Stripe.Price | undefined
    if (pkg.annualPrice) {
      const annualLookupKey = `pm-${pkg.slug}-year`
      annualPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: annualLookupKey,
        unitAmount: Math.round(pkg.annualPrice * 100),
        interval: 'year'
      })
      output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_ANNUAL`] = annualPrice.id
    }

    output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_MONTHLY`] = monthlyPrice.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Monthly Price: ${monthlyPrice.id} ($${pkg.price}/month)`)
    if (annualPrice) {
      console.log(`  ✅ Annual Price: ${annualPrice.id} ($${Math.round(pkg.annualPrice!)}/year)`)
    }
    console.log('')
  }

  // Process Architecture Packages
  console.log('🏗️  Creating Architecture Packages...\n')
  for (const pkg of PRODUCTS.architecturePackages) {
    console.log(`Processing ${pkg.name}...`)
    const product = await upsertProduct(stripe, {
      name: pkg.name,
      description: `${pkg.description}\n\nFeatures:\n${pkg.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: filterMetadata({ ...pkg.metadata, slug: pkg.slug }),
      statementDescriptor: pkg.statementDescriptor,
      taxCode: pkg.taxCode
    })

    const price = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: `arch-${pkg.slug}`,
      unitAmount: Math.round(pkg.price * 100),
      interval: 'one_time'
    })

    output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}`] = price.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Price: ${price.id} ($${pkg.price})`)
    console.log('')
  }

  // Process Project Owner Packages
  console.log('👤 Creating Project Owner Packages...\n')
  for (const pkg of PRODUCTS.projectOwnerPackages) {
    console.log(`Processing ${pkg.name}...`)
    const product = await upsertProduct(stripe, {
      name: pkg.name,
      description: `${pkg.description}\n\nFeatures:\n${pkg.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: filterMetadata({ ...pkg.metadata, slug: pkg.slug }),
      statementDescriptor: pkg.statementDescriptor,
      taxCode: pkg.taxCode
    })

    const monthlyLookupKey = `po-${pkg.slug}-month`
    const monthlyPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: monthlyLookupKey,
      unitAmount: Math.round(pkg.price * 100),
      interval: 'month'
    })

    let annualPrice: Stripe.Price | undefined
    if (pkg.annualPrice) {
      const annualLookupKey = `po-${pkg.slug}-year`
      annualPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: annualLookupKey,
        unitAmount: Math.round(pkg.annualPrice * 100),
        interval: 'year'
      })
      output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_ANNUAL`] = annualPrice.id
    }

    output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_MONTHLY`] = monthlyPrice.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Monthly Price: ${monthlyPrice.id} ($${pkg.price}/month)`)
    if (annualPrice) {
      console.log(`  ✅ Annual Price: ${annualPrice.id} ($${Math.round(pkg.annualPrice!)}/year)`)
    }
    console.log('')
  }

  // Process Permit Packages
  console.log('📋 Creating Permit & Inspection Packages...\n')
  for (const pkg of PRODUCTS.permitPackages) {
    console.log(`Processing ${pkg.name}...`)
    const product = await upsertProduct(stripe, {
      name: pkg.name,
      description: `${pkg.description}\n\nFeatures:\n${pkg.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: filterMetadata({ ...pkg.metadata, slug: pkg.slug }),
      statementDescriptor: pkg.statementDescriptor,
      taxCode: pkg.taxCode
    })

    const monthlyLookupKey = `permit-${pkg.slug}-month`
    const monthlyPrice = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: monthlyLookupKey,
      unitAmount: Math.round(pkg.price * 100),
      interval: 'month'
    })

    let annualPrice: Stripe.Price | undefined
    if (pkg.annualPrice) {
      const annualLookupKey = `permit-${pkg.slug}-year`
      annualPrice = await upsertPrice(stripe, {
        productId: product.id,
        lookupKey: annualLookupKey,
        unitAmount: Math.round(pkg.annualPrice * 100),
        interval: 'year'
      })
      output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_ANNUAL`] = annualPrice.id
    }

    output[`STRIPE_PRICE_${pkg.slug.toUpperCase().replace(/-/g, '_')}_MONTHLY`] = monthlyPrice.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Monthly Price: ${monthlyPrice.id} ($${pkg.price}/month)`)
    if (annualPrice) {
      console.log(`  ✅ Annual Price: ${annualPrice.id} ($${Math.round(pkg.annualPrice!)}/year)`)
    }
    console.log('')
  }

  // Process Ops A La Carte
  console.log('🛒 Creating Ops Services A La Carte...\n')
  for (const productData of PRODUCTS.opsALaCarte) {
    console.log(`Processing ${productData.name}...`)
    const product = await upsertProduct(stripe, {
      name: productData.name,
      description: productData.description,
      metadata: { ...productData.metadata, slug: productData.slug },
      statementDescriptor: productData.statementDescriptor,
      taxCode: productData.taxCode
    })

    const priceAmount = productData.priceRange
      ? Math.round((productData.priceRange.min + productData.priceRange.max) / 2)
      : productData.price

    const price = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: `ops-${productData.slug}`,
      unitAmount: Math.round(priceAmount * 100),
      interval: productData.interval
    })

    output[`STRIPE_PRICE_${productData.slug.toUpperCase().replace(/-/g, '_')}`] = price.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(
      `  ✅ Price: ${price.id} ($${priceAmount}${productData.priceRange ? ` - range: $${productData.priceRange.min}-$${productData.priceRange.max}` : ''})`
    )
    console.log('')
  }

  // Process Estimation Services
  console.log('💰 Creating Estimation Services...\n')
  for (const service of PRODUCTS.estimationServices) {
    console.log(`Processing ${service.name}...`)
    const product = await upsertProduct(stripe, {
      name: service.name,
      description: `${service.description}\n\nFeatures:\n${service.features.map((f) => `• ${f}`).join('\n')}`,
      metadata: filterMetadata({ ...service.metadata, slug: service.slug }),
      statementDescriptor: service.statementDescriptor,
      taxCode: service.taxCode
    })

    const price = await upsertPrice(stripe, {
      productId: product.id,
      lookupKey: `est-${service.slug}`,
      unitAmount: Math.round(service.price * 100),
      interval: 'one_time'
    })

    output[`STRIPE_PRICE_${service.slug.toUpperCase().replace(/-/g, '_')}`] = price.id

    console.log(`  ✅ Product: ${product.id}`)
    console.log(`  ✅ Price: ${price.id} ($${service.price})`)
    console.log('')
  }

  // Output environment variables
  console.log('\n' + '='.repeat(80))
  console.log('📋 ENVIRONMENT VARIABLES')
  console.log('='.repeat(80))
  console.log('\nAdd these to your .env.local and production environment:\n')

  console.log('// PM Packages (monthly)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PM_PACKAGE') && key.includes('MONTHLY')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// PM Packages (annual)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PM_PACKAGE') && key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Architecture Packages')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('ARCH_PACKAGE')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Project Owner Packages (monthly)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PO_PACKAGE') && key.includes('MONTHLY')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Project Owner Packages (annual)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PO_PACKAGE') && key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Permit Packages (monthly)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PERMIT_PACKAGE') && key.includes('MONTHLY')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Permit Packages (annual)')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PERMIT_PACKAGE') && key.includes('ANNUAL')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Ops Services A La Carte')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('PERMIT_APPLICATION') || key.includes('INSPECTION') || 
        key.includes('DOCUMENT') || key.includes('CONTRACTOR') ||
        key.includes('SITE_VISITS') || key.includes('BUDGET') ||
        key.includes('PROGRESS') || key.includes('QUALITY')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n// Estimation Services')
  for (const [key, value] of Object.entries(output)) {
    if (key.includes('ESTIMATION')) {
      console.log(`${key}=${value}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Complete Product Catalog Setup Complete!')
  console.log('='.repeat(80))
  console.log('\nNext steps:')
  console.log('1. Copy the environment variables above to your .env.local')
  console.log('2. Add them to Vercel (all apps)')
  console.log('3. Add them to Railway (API service)')
  console.log('4. Update database seed.ts with the new price IDs')
  console.log('')
}

main().catch((e) => {
  console.error('❌ Error:', e)
  process.exit(1)
})

