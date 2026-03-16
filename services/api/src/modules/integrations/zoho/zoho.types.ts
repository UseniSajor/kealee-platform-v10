/**
 * services/api/src/modules/integrations/zoho/zoho.types.ts
 *
 * Zoho CRM type definitions for the Kealee contractor acquisition pipeline.
 *
 * Module mapping (standard Zoho modules):
 *   Contractor Leads  → Leads
 *   Contractors       → Contacts
 *   Projects          → Deals
 *   Developers        → Accounts
 */

// ─── Pipeline Stages ──────────────────────────────────────────────────────────

export const CONTRACTOR_PIPELINE_STAGES = {
  CONTACTED:             'Contacted',
  INTERESTED:            'Interested',
  REGISTRATION_STARTED:  'Registration Started',
  DOCUMENTS_UPLOADED:    'Documents Uploaded',
  VERIFICATION_PENDING:  'Verification Pending',
  VERIFIED_CONTRACTOR:   'Verified Contractor',
  ACTIVE_CONTRACTOR:     'Active Contractor',
} as const;

export type ContractorPipelineStage =
  typeof CONTRACTOR_PIPELINE_STAGES[keyof typeof CONTRACTOR_PIPELINE_STAGES];

// ─── Zoho Module Names ────────────────────────────────────────────────────────

export const ZOHO_MODULES = {
  LEADS:    'Leads',
  CONTACTS: 'Contacts',
  DEALS:    'Deals',
  ACCOUNTS: 'Accounts',
  NOTES:    'Notes',
  TASKS:    'Tasks',
} as const;

export type ZohoModule = typeof ZOHO_MODULES[keyof typeof ZOHO_MODULES];

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ZohoApiResponse<T = unknown> {
  data?: T[];
  info?: {
    page: number;
    per_page: number;
    count: number;
    more_records: boolean;
  };
}

export interface ZohoWriteResponse {
  data: Array<{
    code:    'SUCCESS' | 'ERROR' | 'DUPLICATE_DATA';
    details: { id?: string; [key: string]: unknown };
    message: string;
    status:  'success' | 'error';
  }>;
}

export interface ZohoTokenResponse {
  access_token:  string;
  token_type:    string;
  expires_in:    number;
  scope?:        string;
  api_domain?:   string;
  error?:        string;
}

// ─── Contractor Lead (Zoho Leads module) ─────────────────────────────────────

export interface ZohoLead {
  id?:                   string;
  First_Name?:           string;
  Last_Name:             string;
  Email?:                string;
  Phone?:                string;
  Company?:              string;
  Lead_Source?:          string;
  Description?:          string;
  // Custom contractor fields (add as Zoho custom fields in your account)
  Contractor_Stage?:     ContractorPipelineStage;
  Target_Trade?:         string;
  Target_Geo?:           string;
  Kealee_Profile_Id?:    string;
  Kealee_User_Id?:       string;
  Shortage_Score?:       number;
  Campaign_Source?:      string;
  Registration_URL?:     string;
  Created_Time?:         string;
  Modified_Time?:        string;
}

export interface CreateLeadInput {
  firstName?:        string;
  lastName:          string;
  email?:            string;
  phone?:            string;
  company?:          string;
  trade?:            string;
  geo?:              string;
  kealeeProfileId?:  string;
  kealeeUserId?:     string;
  shortageScore?:    number;
  campaignSource?:   string;
  registrationUrl?:  string;
}

// ─── Contractor Contact (Zoho Contacts module) ────────────────────────────────

export interface ZohoContact {
  id?:                   string;
  First_Name?:           string;
  Last_Name:             string;
  Email?:                string;
  Phone?:                string;
  Account_Name?:         string;
  // Custom contractor fields
  Contractor_Stage?:     ContractorPipelineStage;
  Kealee_Profile_Id?:    string;
  Kealee_User_Id?:       string;
  Verification_Status?:  string;
  Trades?:               string;
  Service_Areas?:        string;
  Created_Time?:         string;
}

// ─── Zoho Deal (Projects pipeline) ───────────────────────────────────────────

export interface ZohoDeal {
  id?:             string;
  Deal_Name:       string;
  Account_Name?:   string;
  Stage:           string;
  Amount?:         number;
  Closing_Date?:   string;
  Description?:    string;
  Lead_Source?:    string;
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export interface ContractorCampaign {
  trade:        string;
  geo?:         string;
  shortageScore: number;
  priority:     'CRITICAL' | 'HIGH' | 'MEDIUM';
  triggerSource: string;
}

// ─── Webhook Payload ─────────────────────────────────────────────────────────

export interface ZohoWebhookPayload {
  module:    string;
  operation: 'create' | 'update' | 'delete';
  ids?:      string[];
  data?:     Record<string, unknown>[];
}
