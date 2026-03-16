/**
 * services/api/src/modules/marketing/marketing.packages.ts
 *
 * Contractor marketing service package definitions.
 * Three tiers: Starter, Growth, Pro.
 *
 * These are subscription products sold to contractors who want
 * to generate more projects through Kealee's marketing infrastructure.
 */

export type MarketingPackageId = 'starter' | 'growth' | 'pro';

export interface MarketingFeature {
  id:          string;
  name:        string;
  description: string;
  included:    boolean;
  limit?:      string;  // e.g. "$500/mo ad spend"
}

export interface MarketingPackage {
  id:           MarketingPackageId;
  name:         string;
  tagline:      string;
  priceMonthly: number;     // USD cents
  priceAnnual:  number;     // USD cents/mo when paid annually
  priceLabel:   string;
  stripePriceMonthlyId?: string;
  stripePriceAnnualId?:  string;
  features:     MarketingFeature[];
  setupFee?:    number;     // one-time
  onboardingDays: number;
  highlighted?: boolean;
}

// ─── Feature IDs ──────────────────────────────────────────────────────────────

export const FEATURES = {
  // Core
  PROFILE_OPTIMIZATION:  'profile_optimization',
  MARKETPLACE_PRIORITY:  'marketplace_priority',
  PERFORMANCE_REPORT:    'performance_report',

  // Starter+
  LANDING_PAGE:          'landing_page',
  SEO_OPTIMIZATION:      'seo_optimization',
  LEAD_CAPTURE_FORM:     'lead_capture_form',
  LEAD_NOTIFICATIONS:    'lead_notifications',
  CRM_INTEGRATION:       'crm_integration',

  // Growth+
  GOOGLE_ADS:            'google_ads',
  AD_SPEND_INCLUDED:     'ad_spend_included',
  EMAIL_SEQUENCES:       'email_sequences',
  SMS_SEQUENCES:         'sms_sequences',
  REVIEW_MANAGEMENT:     'review_management',
  RETARGETING:           'retargeting',

  // Pro only
  ACCOUNT_MANAGER:       'account_manager',
  CUSTOM_CAMPAIGN:       'custom_campaign',
  COMPETITOR_ANALYSIS:   'competitor_analysis',
  MULTI_LOCATION:        'multi_location',
};

// ─── Package Definitions ──────────────────────────────────────────────────────

export const MARKETING_PACKAGES: Record<MarketingPackageId, MarketingPackage> = {

  starter: {
    id:              'starter',
    name:            'Starter',
    tagline:         'Get found. Get more calls.',
    priceMonthly:    9900,
    priceAnnual:     7900,
    priceLabel:      '$99/mo',
    stripePriceMonthlyId: process.env.STRIPE_PRICE_MKT_STARTER_MONTHLY,
    stripePriceAnnualId:  process.env.STRIPE_PRICE_MKT_STARTER_ANNUAL,
    onboardingDays:  3,
    features: [
      { id: FEATURES.PROFILE_OPTIMIZATION, name: 'Profile Optimization',    description: 'Optimized contractor profile with SEO-friendly description and photos', included: true },
      { id: FEATURES.MARKETPLACE_PRIORITY, name: 'Marketplace Priority',     description: 'Priority placement in contractor search results for your trade/geo',     included: true },
      { id: FEATURES.PERFORMANCE_REPORT,   name: 'Monthly Performance Report', description: 'Views, contacts, and project wins per month',                          included: true },
      { id: FEATURES.LANDING_PAGE,         name: 'Contractor Landing Page',  description: 'Custom kealee.com/contractor/your-name landing page',                    included: true },
      { id: FEATURES.LEAD_NOTIFICATIONS,   name: 'Lead Notifications',       description: 'Email + SMS alerts when a project lead matches your profile',            included: true },
      { id: FEATURES.GOOGLE_ADS,           name: 'Google Ads Management',    description: 'Managed Google Ads campaigns',                                            included: false },
      { id: FEATURES.EMAIL_SEQUENCES,      name: 'Email Sequences',          description: 'Automated follow-up email campaigns',                                    included: false },
      { id: FEATURES.SMS_SEQUENCES,        name: 'SMS Sequences',            description: 'Automated SMS follow-up sequences',                                      included: false },
      { id: FEATURES.CRM_INTEGRATION,      name: 'CRM Integration',          description: 'Zoho CRM contact sync',                                                  included: false },
      { id: FEATURES.ACCOUNT_MANAGER,      name: 'Dedicated Account Manager', description: 'Personal marketing account manager',                                    included: false },
    ],
  },

  growth: {
    id:              'growth',
    name:            'Growth',
    tagline:         'Your own lead machine.',
    priceMonthly:    29900,
    priceAnnual:     24900,
    priceLabel:      '$299/mo',
    stripePriceMonthlyId: process.env.STRIPE_PRICE_MKT_GROWTH_MONTHLY,
    stripePriceAnnualId:  process.env.STRIPE_PRICE_MKT_GROWTH_ANNUAL,
    onboardingDays:  7,
    highlighted:     true,
    features: [
      { id: FEATURES.PROFILE_OPTIMIZATION, name: 'Profile Optimization',      description: 'Everything in Starter',                                                    included: true },
      { id: FEATURES.MARKETPLACE_PRIORITY, name: 'Marketplace Priority',       description: 'Premium priority placement — top of search results',                      included: true },
      { id: FEATURES.PERFORMANCE_REPORT,   name: 'Weekly Performance Reports', description: 'Weekly analytics on leads, views, and conversion',                        included: true },
      { id: FEATURES.LANDING_PAGE,         name: 'Custom Landing Page',        description: 'Branded landing page with custom domain support',                         included: true },
      { id: FEATURES.SEO_OPTIMIZATION,     name: 'SEO Optimization',           description: 'On-page SEO for your trade + location keywords',                          included: true },
      { id: FEATURES.LEAD_CAPTURE_FORM,    name: 'Lead Capture Form',          description: 'Embedded contact form with lead routing',                                 included: true },
      { id: FEATURES.LEAD_NOTIFICATIONS,   name: 'Lead Notifications',         description: 'Real-time email + SMS lead alerts',                                       included: true },
      { id: FEATURES.CRM_INTEGRATION,      name: 'CRM Integration',            description: 'Zoho CRM sync — leads auto-created as contacts',                          included: true },
      { id: FEATURES.EMAIL_SEQUENCES,      name: 'Email Sequences',            description: '3-email follow-up sequence per lead via SendGrid',                        included: true },
      { id: FEATURES.SMS_SEQUENCES,        name: 'SMS Sequences',              description: '2-SMS follow-up sequence per lead via Twilio',                            included: true },
      { id: FEATURES.GOOGLE_ADS,           name: 'Google Ads Management',      description: 'Managed Google Ads — you supply the budget',                             included: false },
      { id: FEATURES.AD_SPEND_INCLUDED,    name: 'Ad Spend Budget',            description: '$500/mo ad spend included',                                               included: false },
      { id: FEATURES.ACCOUNT_MANAGER,      name: 'Dedicated Account Manager',  description: 'Personal marketing account manager',                                      included: false },
    ],
  },

  pro: {
    id:              'pro',
    name:            'Pro',
    tagline:         'Full-stack contractor marketing.',
    priceMonthly:    79900,
    priceAnnual:     69900,
    priceLabel:      '$799/mo',
    stripePriceMonthlyId: process.env.STRIPE_PRICE_MKT_PRO_MONTHLY,
    stripePriceAnnualId:  process.env.STRIPE_PRICE_MKT_PRO_ANNUAL,
    setupFee:        99900,  // $999 one-time setup
    onboardingDays:  14,
    features: [
      { id: FEATURES.PROFILE_OPTIMIZATION, name: 'Everything in Growth',        description: 'All Growth features included',                                             included: true },
      { id: FEATURES.GOOGLE_ADS,           name: 'Google Ads Management',        description: 'Full Google Ads campaign management (Search + Display)',                  included: true },
      { id: FEATURES.AD_SPEND_INCLUDED,    name: 'Ad Spend Included',            description: '$500/mo ad spend included in subscription',                               included: true, limit: '$500/mo' },
      { id: FEATURES.REVIEW_MANAGEMENT,    name: 'Review Management',            description: 'Automated review requests via Google Business + Yelp',                    included: true },
      { id: FEATURES.RETARGETING,          name: 'Retargeting Campaigns',        description: 'Google + Facebook retargeting for website visitors',                      included: true },
      { id: FEATURES.CUSTOM_CAMPAIGN,      name: 'Custom Campaign Strategy',     description: 'Quarterly campaign planning call with marketing strategist',              included: true },
      { id: FEATURES.COMPETITOR_ANALYSIS,  name: 'Competitor Analysis',          description: 'Monthly competitor tracking for your trade + territory',                  included: true },
      { id: FEATURES.MULTI_LOCATION,       name: 'Multi-Location Support',       description: 'Marketing for up to 3 service territories',                               included: true, limit: '3 territories' },
      { id: FEATURES.ACCOUNT_MANAGER,      name: 'Dedicated Account Manager',    description: 'Named account manager, weekly check-ins',                                 included: true },
    ],
  },
};

export function getPackage(id: MarketingPackageId): MarketingPackage {
  return MARKETING_PACKAGES[id];
}

export function getAllPackages(): MarketingPackage[] {
  return Object.values(MARKETING_PACKAGES);
}
