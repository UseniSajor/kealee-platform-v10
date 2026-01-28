// ============================================================
// INTEGRATION TYPES
// ============================================================

export type IntegrationTier = 'API' | 'PORTAL' | 'MANUAL' | 'OCR';

export type IntegrationProvider = 'ACCELA' | 'TYLER' | 'GOVOS' | 'CUSTOM' | 'NONE' | 'EMAIL';

export interface IntegrationConfig {
  jurisdictionId: string;
  provider: IntegrationProvider;
  tier: IntegrationTier;
  isActive: boolean;
  
  // API Configuration
  apiUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  oauthConfig?: OAuth2Config;
  
  // Portal Configuration
  portalUrl?: string;
  loginCredentials?: {
    username: string;
    password: string; // Encrypted
  };
  automationConfig?: AutomationConfig;
  
  // Manual Configuration
  manualContactEmail?: string;
  manualContactPhone?: string;
  
  // OCR Configuration
  ocrEnabled?: boolean;
  ocrConfig?: OCRConfig;
  
  // Retry & Fallback
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  fallbackTier?: IntegrationTier;
  
  // Rate Limiting
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  redirectUri?: string;
  grantType: 'authorization_code' | 'client_credentials';
}

export interface AutomationConfig {
  headless: boolean;
  timeout: number; // milliseconds
  waitForSelector?: string;
  formSelectors?: Record<string, string>;
  navigationSteps?: Array<{
    action: 'click' | 'type' | 'select' | 'upload' | 'wait';
    selector?: string;
    value?: string;
    waitTime?: number;
  }>;
}

export interface OCRConfig {
  language: string;
  psm: number; // Page segmentation mode
  confidenceThreshold: number; // 0-1
}

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tier: IntegrationTier;
  provider: IntegrationProvider;
  processingTimeMs: number;
  retryCount?: number;
  fallbackUsed?: boolean;
}

export interface PermitSubmissionData {
  permitId: string;
  jurisdictionId: string;
  permitType: string;
  formData: Record<string, any>;
  documents: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

export interface StatusCheckResult {
  permitNumber?: string;
  status: string;
  lastUpdated: Date;
  comments?: string[];
  nextSteps?: string[];
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
}

export interface IntegrationHealth {
  jurisdictionId: string;
  provider: IntegrationProvider;
  tier: IntegrationTier;
  status: 'healthy' | 'degraded' | 'down';
  lastSuccessfulSync?: Date;
  lastError?: string;
  errorCount: number;
  successRate: number; // 0-1
  avgResponseTime: number; // milliseconds
  uptime: number; // percentage
}

export interface IntegrationLog {
  id: string;
  jurisdictionId: string;
  integrationId: string;
  action: string;
  tier: IntegrationTier;
  provider: IntegrationProvider;
  success: boolean;
  errorMessage?: string;
  processingTimeMs: number;
  retryCount: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}
