/**
 * bots/keabot-marketing/src/marketing.types.ts
 */

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerEvent: 'new_lead' | 'bid_received' | 'design_complete' | 'payment_received';
}

export interface EmailSequence {
  name: string;
  emails: EmailStep[];
  triggerEvent: string;
}

export interface EmailStep {
  subject: string;
  body: string;
  delayDays: number;
  personalization: string[];
}

export interface LeadScoringRules {
  budgetWeight: number;
  locationWeight: number;
  projectTypeWeight: number;
  urgencyWeight: number;
  conversionHistoryWeight: number;
  qualityThreshold: number;
}

export interface SocialMediaAsset {
  platform: string;
  width: number;
  height: number;
  format: string;
  count: number;
}

export interface MarketingCampaign {
  name: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  channels: string[];
  expectedLeads: number;
}

export interface LeadQualityMetric {
  leadId: string;
  score: number;
  tier: 'hot' | 'warm' | 'cool';
  factors: {
    budget: number;
    location: number;
    projectType: number;
    urgency: number;
  };
}
