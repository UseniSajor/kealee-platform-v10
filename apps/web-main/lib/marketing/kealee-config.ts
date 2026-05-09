/**
 * Kealee Marketing Automation Configuration
 * 
 * All settings for Phase 1, 2, and 3
 * - Lead scoring rules
 * - SMS templates
 * - GHL workflows
 * - Slack channels
 * - ROI targets
 */

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1: LEAD SCORING CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const PHASE1_CONFIG = {
  // Lead scoring weights
  scoring: {
    baseScore: 50,
    weights: {
      source: { min: 2, max: 12 },
      budget: { min: -10, max: 25 },
      timeline: { min: -5, max: 20 },
      service: { min: 0, max: 18 },
      documents: { min: 0, max: 10 },
    },
    thresholds: {
      hot: 75,          // ≥75: immediate SMS alert
      medium: 50,       // 50-74: nurture track
      cold: 25,         // 25-49: cold outreach
      nurture: 0,       // <25: long-term follow-up
    },
  },

  // SMS alert templates
  sms: {
    hotLeadAlert: (name, service, budget, timeline, link) =>
      `🔥 Hot! ${name} | ${service} | ${budget} | ${timeline} | ${link}`,
    
    qualifiedScheduling: () =>
      `Great! Pick a time: 1) Wed 2pm | 2) Thu 10am | 3) Fri 3pm?`,
    
    confirmationWithLink: (link) =>
      `Perfect! Your call: ${link}`,
  },

  // GHL contact tagging
  ghl: {
    tags: {
      hot: 'hot',
      medium: 'medium',
      cold: 'cold',
      nurture: 'nurture',
      facebook: 'facebook',
      google: 'google',
      web: 'web',
    },
    customFields: {
      lead_score: 'lead_score',
      budget: 'budget',
      timeline: 'timeline',
      service: 'service',
      kealee_intake_id: 'kealee_intake_id',
      source_channel: 'source_channel',
    },
  },

  // SMS alert recipient (YOUR_SMS_NUMBER)
  alertRecipient: process.env.YOUR_SMS_NUMBER,

  // Cron schedule
  cron: {
    leadScoring: '*/5 * * * *',  // Every 5 minutes
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2: AI QUALIFICATION CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const PHASE2_CONFIG = {
  // AI qualification scoring
  ai: {
    confidenceThresholds: {
      qualify: 75,      // ≥75%: schedule call
      nurture: 50,      // 50-74%: add to nurture sequence
      reject: 0,        // <50%: move to cold list
    },
    // Model is sourced from @kealee/core-rules AI_MODELS at call site
    // (lib/marketing/ai-qualifier.ts). This field is informational only.
    model: 'claude-sonnet-4-5',
    maxTokens: 300,
  },

  // Calendly integration
  calendly: {
    daysAhead: 7,      // Show availability next 7 days
    timezone: 'America/New_York',
    slotsPerDay: 3,    // Show 3 available slots
  },

  // Slack notifications
  slack: {
    channels: {
      leads: '#leads',           // All hot/medium leads
      urgent: '#urgent',         // Urgent SMS replies
      alerts: '#alerts',         // Errors
      dailyDigest: '#leads',     // Daily summary
    },
    features: {
      sendHotLeads: true,
      sendDailyDigest: true,
      sendUrgentEscalations: true,
      digestTime: '09:00',       // 9 AM ET
    },
  },

  // Cold lead requalification
  coldLead: {
    requalifyFrequency: '0 */12 * * *',  // Every 12 hours
    scoreBoostThreshold: 15,               // If score bumps 15+ points
    activityCheckDays: 7,                  // Last 7 days
  },

  // SMS reply classification
  smsReply: {
    urgencyLevels: {
      urgent: 'urgent',      // Call immediately
      escalate: 'escalate',  // Manager attention
      followup: 'followup',  // Standard follow-up
      closed: 'closed',      // Conversation done
    },
  },

  // Cron schedule
  cron: {
    requalifyCold: '0 */12 * * *',     // Every 12 hours
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3: MULTI-CHANNEL CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const PHASE3_CONFIG = {
  // Facebook Lead Ads
  facebook: {
    webhookPath: '/api/webhooks/facebook-leads',
    signatureHeader: 'x-hub-signature-256',
    events: ['leadgen'],
  },

  // Google Ads conversion tracking
  google: {
    conversionActions: {
      leadPaid: 'lead_paid',
      dealWon: 'deal_won',
    },
    roiTracking: {
      costPerLead: 'cost_per_lead',
      costPerQualified: 'cost_per_qualified',
      costPerDeal: 'cost_per_deal',
      roi: 'roi',
    },
  },

  // Inbound SMS classification
  inboundSms: {
    escalationThreshold: 'urgent',
  },

  // ROI metrics
  roi: {
    monthlySnapshot: '0 0 1 * *',  // 1st of month, midnight
    targets: {
      costPerLead: 30,             // $30 max
      costPerDeal: 350,            // $350 max
      roi: 2.0,                    // 2:1 minimum
      conversionRate: 0.15,        // 15% of leads
    },
  },

  // Lead sources tracking
  sources: {
    web: 'web',
    facebook: 'facebook',
    google: 'google',
    referral: 'referral',
    other: 'other',
  },

  // Cron schedule
  cron: {
    monthlyRoiSnapshot: '0 0 1 * *',  // 1st of month
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// KEALEE INTERNAL MARKETING TARGETS
// ══════════════════════════════════════════════════════════════════════════════

export const KEALEE_MARKETING_TARGETS = {
  // Phase 1 targets (Week 1-2)
  phase1: {
    leadVolume: 20,           // Leads/week minimum
    hotPercentage: 0.15,      // 15% should be hot
    smsLatency: 120,          // 2 minutes max
    ghlSyncSuccess: 1.0,      // 100% success
    scoringAccuracy: 0.85,    // 85% manual review agrees
  },

  // Phase 2 targets (Week 3-4)
  phase2: {
    aiQualificationAccuracy: 0.80,  // 80% manual review agrees
    autoScheduledPercentage: 0.50,  // 50% of qualified leads
    smsResponseRate: 0.35,          // 35% respond to SMS
    slackNotificationDelivery: 1.0, // 100%
  },

  // Phase 3 targets (Week 5-6)
  phase3: {
    facebookLeadVolume: 10,   // Leads/day
    googleLeadVolume: 8,      // Leads/day
    multiChannelDedup: 0.99,  // 99% accuracy
    roiMinimum: 2.0,          // 2:1 revenue to spend
  },

  // Overall targets (Month 1)
  month1: {
    totalLeads: 150,
    hotLeads: 30,             // 20% hot
    aiQualified: 20,          // 13% of all leads
    autoScheduled: 10,        // 7% of all leads, 50% of qualified
    dealsClosed: 2,           // 1-2 deals
    totalRevenue: 10000,      // $10k minimum
  },

  // Overall targets (Month 2)
  month2: {
    totalLeads: 300,
    hotLeads: 50,
    aiQualified: 50,          // Increase to 17%
    autoScheduled: 30,        // Increase to 10%
    dealsClosed: 6,           // 2% conversion
    totalRevenue: 30000,      // $30k
    costPerLead: 25,
    roi: 2.5,
  },

  // Overall targets (Month 3+)
  month3Plus: {
    totalLeads: 500,
    hotLeads: 75,
    aiQualified: 100,         // 20% qualified
    autoScheduled: 60,        // 60% of qualified
    dealsClosed: 15,          // 3% conversion
    totalRevenue: 75000,      // $75k/month
    costPerLead: 20,
    roi: 3.0,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD METRICS & MONITORING
// ══════════════════════════════════════════════════════════════════════════════

export const MONITORING_DASHBOARDS = {
  // Real-time monitoring
  realtime: {
    metrics: [
      'active_hot_leads_today',
      'sms_sent_today',
      'ghl_contacts_synced_today',
      'calendar_events_created_today',
      'ai_qualifications_today',
    ],
    refreshInterval: 60,  // Every 60 seconds
  },

  // Daily monitoring
  daily: {
    metrics: [
      'leads_received',
      'hot_leads',
      'medium_leads',
      'cold_leads',
      'sms_delivered_rate',
      'ghl_sync_success_rate',
      'ai_qualification_rate',
      'calendly_show_rate',
    ],
    reportTime: '09:00',  // 9 AM daily
  },

  // Weekly monitoring
  weekly: {
    metrics: [
      'total_leads',
      'hot_percentage',
      'qualified_percentage',
      'auto_scheduled_percentage',
      'show_rate',
      'deal_closure_rate',
      'cost_per_lead',
      'roi',
    ],
    reportDay: 'Monday',
    reportTime: '09:00',
  },

  // Monthly monitoring
  monthly: {
    metrics: [
      'total_revenue',
      'total_cost',
      'roi',
      'deals_closed',
      'customer_acquisition_cost',
      'channel_performance',
      'scoring_accuracy',
    ],
    reportDay: 1,         // 1st of month
    reportTime: '00:00',
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT FULL CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const KEALEE_MARKETING_CONFIG = {
  phase1: PHASE1_CONFIG,
  phase2: PHASE2_CONFIG,
  phase3: PHASE3_CONFIG,
  targets: KEALEE_MARKETING_TARGETS,
  monitoring: MONITORING_DASHBOARDS,

  // Deployment info
  deployment: {
    platform: 'Vercel (web-main)',
    database: 'Supabase PostgreSQL',
    crm: 'GoHighLevel',
    ai: 'Claude Sonnet 4.5 (default) / Opus 4.1 (premium tiers)',
    sms: 'Twilio',
    scheduling: 'Calendly',
    notifications: 'Slack',
  },

  // Support contacts
  support: {
    marketing: process.env.MARKETING_CONTACT_EMAIL,
    technical: process.env.TECHNICAL_CONTACT_EMAIL,
    oncall: process.env.ONCALL_NUMBER,
  },

  // Feature flags
  features: {
    leadScoring: true,
    smsAlerts: true,
    ghlSync: true,
    aiQualification: false,  // Enable after Phase 1 stable
    calendlyScheduling: false,
    slackNotifications: false,
    facebookLeadAds: false,
    googleAds: false,
    roiTracking: false,
  },

  // Rollback procedures
  rollback: {
    phase1: 'Disable cron job + GHL webhook, pause SMS',
    phase2: 'Disable AI qualification + Calendly',
    phase3: 'Disable Facebook/Google webhooks',
  },
}

export default KEALEE_MARKETING_CONFIG
