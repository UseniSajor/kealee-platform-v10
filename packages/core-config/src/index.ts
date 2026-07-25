/**
 * packages/core-config/src/index.ts
 *
 * Shared environment configuration loader with fail-fast validation.
 * Import at service startup before any other code runs.
 *
 * Usage:
 *   import { loadConfig, validateApiConfig, validateCommandCenterConfig } from '@kealee/core-config'
 *
 *   // In api/src/index.ts:
 *   validateApiConfig()   // throws if required vars missing
 *
 *   // In command-center:
 *   validateCommandCenterConfig()
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiConfig {
  nodeEnv:          string;
  port:             number;
  databaseUrl:      string;
  supabaseUrl:      string;
  supabaseAnonKey:  string;
  internalApiKey:   string;
  // Zoho
  zohoClientId:     string;
  zohoClientSecret: string;
  zohoRefreshToken: string;
  zohoDomain:       string;
  zohoWebhookToken: string;
  // Optional
  redisUrl?:        string;
  stripeSecretKey?: string;
}

export interface CommandCenterConfig {
  nodeEnv:             string;
  databaseUrl:         string;
  redisUrl:            string;
  internalApiUrl:      string;
  internalApiKey:      string;
  // SendGrid
  sendgridApiKey:      string;
  sendgridFromEmail:   string;
  sendgridFromName:    string;
  // Twilio
  twilioAccountSid:    string;
  twilioAuthToken:     string;
  twilioPhoneNumber?:  string;
  twilioMsgServiceSid?: string;
  // URLs
  webMainUrl:          string;
  portalContractorUrl: string;
  // AI
  anthropicApiKey:     string;
}

export interface AiAutomationConfig {
  aiVoiceEnabled: boolean;
  aiOutboundCallingEnabled: boolean;
  aiSmsEnabled: boolean;
  conversationIntelligenceEnabled: boolean;
  sitePlanAutomationEnabled: boolean;
  engineeringInfillPhase1Enabled: boolean;
  engineeringSurveyOcrEnabled: boolean;
  engineeringDxfGenerationEnabled: boolean;
  engineeringTerrainAnalysisEnabled: boolean;
  engineeringStormwaterEnabled: boolean;
  engineeringProfessionalReviewRequired: boolean;
  professionalReviewRequired: boolean;
  permitSubmissionAutomationEnabled: boolean;
  pgCountyRulePackEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioVoiceNumber?: string;
  twilioMessagingNumber?: string;
  twilioConversationRelayUrl?: string;
  twilioStatusCallbackUrl?: string;
  twilioRecordingEnabled: boolean;
  twilioConversationIntelligenceServiceSid?: string;
  voiceHumanTransferNumber?: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

type EnvSpec = {
  key:        string;
  required:   boolean;
  validate?:  (val: string) => string | null; // return error message or null
};

function checkEnv(specs: EnvSpec[]): string[] {
  const errors: string[] = [];

  for (const spec of specs) {
    const val = process.env[spec.key];

    if (!val || val.trim() === '') {
      if (spec.required) {
        errors.push(`${spec.key}: required but not set`);
      }
      continue;
    }

    if (spec.validate) {
      const err = spec.validate(val);
      if (err) errors.push(`${spec.key}: ${err}`);
    }
  }

  return errors;
}

function isUrl(val: string): string | null {
  try { new URL(val); return null; }
  catch { return `"${val}" is not a valid URL`; }
}

function minLen(n: number) {
  return (val: string) => val.length >= n ? null : `must be at least ${n} characters`;
}

function startsWith(prefix: string) {
  return (val: string) => val.startsWith(prefix) ? null : `must start with "${prefix}"`;
}

function isE164(val: string): string | null {
  return /^\+[1-9]\d{1,14}$/.test(val) ? null : 'must be E.164 format (+1XXXXXXXXXX)';
}

function isEmail(val: string): string | null {
  return /.+@.+\..+/.test(val) ? null : 'must be a valid email address';
}

function parseBoolean(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return defaultValue;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${key}: must be exactly "true" or "false"`);
}

function requireWhen(enabled: boolean, specs: EnvSpec[]): string[] {
  return enabled ? checkEnv(specs.map((spec) => ({ ...spec, required: true }))) : [];
}

// ─── API service validation ───────────────────────────────────────────────────

const API_SPECS: EnvSpec[] = [
  { key: 'DATABASE_URL',       required: true,  validate: isUrl },
  { key: 'SUPABASE_URL',       required: true,  validate: isUrl },
  { key: 'SUPABASE_ANON_KEY',  required: true,  validate: minLen(10) },
  { key: 'INTERNAL_API_KEY',   required: true,  validate: minLen(32) },
  // Zoho — required for contractor acquisition
  { key: 'ZOHO_CLIENT_ID',     required: true,  validate: minLen(5) },
  { key: 'ZOHO_CLIENT_SECRET', required: true,  validate: minLen(10) },
  { key: 'ZOHO_REFRESH_TOKEN', required: true,  validate: minLen(10) },
  { key: 'ZOHO_WEBHOOK_TOKEN', required: true,  validate: minLen(16) },
];

export function validateApiConfig(): void {
  const errors = checkEnv(API_SPECS);
  if (errors.length > 0) {
    console.error('\n❌ API service startup FAILED — invalid environment:\n');
    for (const e of errors) console.error(`  • ${e}`);
    console.error('\nFix the above errors and redeploy.\n');
    process.exit(1);
  }
  console.log('✅ API environment validated');
}

// ─── Command-center service validation ───────────────────────────────────────

const COMMAND_CENTER_SPECS: EnvSpec[] = [
  { key: 'DATABASE_URL',        required: true, validate: isUrl },
  { key: 'REDIS_URL',           required: true, validate: minLen(5) },
  { key: 'INTERNAL_API_URL',    required: true, validate: isUrl },
  { key: 'INTERNAL_API_KEY',    required: true, validate: minLen(32) },
  // SendGrid
  { key: 'SENDGRID_API_KEY',    required: true, validate: startsWith('SG.') },
  { key: 'SENDGRID_FROM_EMAIL', required: true, validate: isEmail },
  // Twilio
  { key: 'TWILIO_ACCOUNT_SID',  required: true, validate: startsWith('AC') },
  { key: 'TWILIO_AUTH_TOKEN',   required: true, validate: minLen(32) },
  // Phone OR messaging service required
  { key: 'TWILIO_PHONE_NUMBER', required: false, validate: (v) =>
      process.env.TWILIO_MESSAGING_SERVICE_SID ? null : isE164(v) },
  // AI
  { key: 'ANTHROPIC_API_KEY',   required: true, validate: startsWith('sk-ant-') },
];

export function validateCommandCenterConfig(): void {
  const errors = checkEnv(COMMAND_CENTER_SPECS);

  // Either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID required
  const hasPhone = !!(process.env.TWILIO_PHONE_NUMBER);
  const hasMsgSvc = !!(process.env.TWILIO_MESSAGING_SERVICE_SID);
  if (!hasPhone && !hasMsgSvc) {
    errors.push('Either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID is required');
  }

  if (errors.length > 0) {
    console.error('\n❌ Command-center startup FAILED — invalid environment:\n');
    for (const e of errors) console.error(`  • ${e}`);
    console.error('\nFix the above errors and redeploy.\n');
    process.exit(1);
  }
  console.log('✅ Command-center environment validated');
}

// ─── Config loaders ───────────────────────────────────────────────────────────

export function getApiConfig(): ApiConfig {
  return {
    nodeEnv:          process.env.NODE_ENV ?? 'production',
    port:             parseInt(process.env.PORT ?? '3000', 10),
    databaseUrl:      process.env.DATABASE_URL!,
    supabaseUrl:      process.env.SUPABASE_URL!,
    supabaseAnonKey:  process.env.SUPABASE_ANON_KEY!,
    internalApiKey:   process.env.INTERNAL_API_KEY!,
    zohoClientId:     process.env.ZOHO_CLIENT_ID!,
    zohoClientSecret: process.env.ZOHO_CLIENT_SECRET!,
    zohoRefreshToken: process.env.ZOHO_REFRESH_TOKEN!,
    zohoDomain:       process.env.ZOHO_DOMAIN ?? 'com',
    zohoWebhookToken: process.env.ZOHO_WEBHOOK_TOKEN!,
    redisUrl:         process.env.REDIS_URL,
    stripeSecretKey:  process.env.STRIPE_SECRET_KEY,
  };
}

export function getCommandCenterConfig(): CommandCenterConfig {
  return {
    nodeEnv:             process.env.NODE_ENV ?? 'production',
    databaseUrl:         process.env.DATABASE_URL!,
    redisUrl:            process.env.REDIS_URL!,
    internalApiUrl:      process.env.INTERNAL_API_URL!,
    internalApiKey:      process.env.INTERNAL_API_KEY!,
    sendgridApiKey:      process.env.SENDGRID_API_KEY!,
    sendgridFromEmail:   process.env.SENDGRID_FROM_EMAIL!,
    sendgridFromName:    process.env.SENDGRID_FROM_NAME ?? 'Kealee Platform',
    twilioAccountSid:    process.env.TWILIO_ACCOUNT_SID!,
    twilioAuthToken:     process.env.TWILIO_AUTH_TOKEN!,
    twilioPhoneNumber:   process.env.TWILIO_PHONE_NUMBER,
    twilioMsgServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    webMainUrl:          process.env.WEB_MAIN_URL ?? 'https://kealee.com',
    portalContractorUrl: process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com',
    anthropicApiKey:     process.env.ANTHROPIC_API_KEY!,
  };
}

/**
 * Validate external and consequential AI automation independently from the
 * legacy service configuration. Disabled features require no provider secret;
 * enabled features fail closed when their complete server-side config is absent.
 */
export function getAiAutomationConfig(): AiAutomationConfig {
  const aiVoiceEnabled = parseBoolean('AI_VOICE_ENABLED', false);
  const aiOutboundCallingEnabled = parseBoolean('AI_OUTBOUND_CALLING_ENABLED', false);
  const aiSmsEnabled = parseBoolean('AI_SMS_ENABLED', false);
  const conversationIntelligenceEnabled = parseBoolean('CONVERSATION_INTELLIGENCE_ENABLED', false);
  const sitePlanAutomationEnabled = parseBoolean('SITE_PLAN_AUTOMATION_ENABLED', false);
  const engineeringInfillPhase1Enabled = parseBoolean('ENGINEERING_INFILL_PHASE1_ENABLED', false);
  const engineeringSurveyOcrEnabled = parseBoolean('ENGINEERING_SURVEY_OCR_ENABLED', false);
  const engineeringDxfGenerationEnabled = parseBoolean('ENGINEERING_DXF_GENERATION_ENABLED', false);
  const engineeringTerrainAnalysisEnabled = parseBoolean('ENGINEERING_TERRAIN_ANALYSIS_ENABLED', false);
  const engineeringStormwaterEnabled = parseBoolean('ENGINEERING_STORMWATER_ENABLED', false);
  const engineeringProfessionalReviewRequired = parseBoolean('ENGINEERING_PROFESSIONAL_REVIEW_REQUIRED', true);
  const professionalReviewRequired = parseBoolean('PROFESSIONAL_REVIEW_REQUIRED', true);
  const permitSubmissionAutomationEnabled = parseBoolean('PERMIT_SUBMISSION_AUTOMATION_ENABLED', false);
  const pgCountyRulePackEnabled = parseBoolean('PG_COUNTY_RULE_PACK_ENABLED', false);
  const twilioRecordingEnabled = parseBoolean('TWILIO_RECORDING_ENABLED', false);

  const voiceOrMessagingEnabled = aiVoiceEnabled || aiOutboundCallingEnabled || aiSmsEnabled;
  const errors = requireWhen(voiceOrMessagingEnabled, [
    { key: 'TWILIO_ACCOUNT_SID', required: true, validate: startsWith('AC') },
    { key: 'TWILIO_AUTH_TOKEN', required: true, validate: minLen(32) },
  ]);

  errors.push(...requireWhen(aiVoiceEnabled, [
    { key: 'TWILIO_VOICE_NUMBER', required: true, validate: isE164 },
    { key: 'TWILIO_CONVERSATION_RELAY_URL', required: true, validate: isUrl },
    { key: 'TWILIO_STATUS_CALLBACK_URL', required: true, validate: isUrl },
    { key: 'VOICE_HUMAN_TRANSFER_NUMBER', required: true, validate: isE164 },
  ]));
  errors.push(...requireWhen(aiSmsEnabled, [
    { key: 'TWILIO_MESSAGING_NUMBER', required: true, validate: isE164 },
  ]));
  errors.push(...requireWhen(conversationIntelligenceEnabled, [
    { key: 'TWILIO_CONVERSATION_INTELLIGENCE_SERVICE_SID', required: true, validate: minLen(4) },
  ]));

  if (aiOutboundCallingEnabled && !aiVoiceEnabled) {
    errors.push('AI_OUTBOUND_CALLING_ENABLED requires AI_VOICE_ENABLED=true');
  }
  if (conversationIntelligenceEnabled && !aiVoiceEnabled) {
    errors.push('CONVERSATION_INTELLIGENCE_ENABLED requires AI_VOICE_ENABLED=true');
  }
  if (permitSubmissionAutomationEnabled && !sitePlanAutomationEnabled) {
    errors.push('PERMIT_SUBMISSION_AUTOMATION_ENABLED requires SITE_PLAN_AUTOMATION_ENABLED=true');
  }
  if (sitePlanAutomationEnabled && !professionalReviewRequired) {
    errors.push('PROFESSIONAL_REVIEW_REQUIRED must remain true while SITE_PLAN_AUTOMATION_ENABLED=true');
  }
  if (engineeringInfillPhase1Enabled && !sitePlanAutomationEnabled) {
    errors.push('ENGINEERING_INFILL_PHASE1_ENABLED requires SITE_PLAN_AUTOMATION_ENABLED=true');
  }
  if (engineeringInfillPhase1Enabled && !engineeringProfessionalReviewRequired) {
    errors.push('ENGINEERING_PROFESSIONAL_REVIEW_REQUIRED must remain true for Phase 1');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid AI automation environment:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  return {
    aiVoiceEnabled,
    aiOutboundCallingEnabled,
    aiSmsEnabled,
    conversationIntelligenceEnabled,
    sitePlanAutomationEnabled,
    engineeringInfillPhase1Enabled,
    engineeringSurveyOcrEnabled,
    engineeringDxfGenerationEnabled,
    engineeringTerrainAnalysisEnabled,
    engineeringStormwaterEnabled,
    engineeringProfessionalReviewRequired,
    professionalReviewRequired,
    permitSubmissionAutomationEnabled,
    pgCountyRulePackEnabled,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioVoiceNumber: process.env.TWILIO_VOICE_NUMBER,
    twilioMessagingNumber: process.env.TWILIO_MESSAGING_NUMBER,
    twilioConversationRelayUrl: process.env.TWILIO_CONVERSATION_RELAY_URL,
    twilioStatusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
    twilioRecordingEnabled,
    twilioConversationIntelligenceServiceSid: process.env.TWILIO_CONVERSATION_INTELLIGENCE_SERVICE_SID,
    voiceHumanTransferNumber: process.env.VOICE_HUMAN_TRANSFER_NUMBER,
  };
}
