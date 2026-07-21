export type VoiceLocale = string;

export interface VoiceCallContext {
  contactId?: string;
  leadId?: string;
  projectId?: string;
  organizationId?: string;
  correlationId: string;
}

export interface StartOutboundVoiceCallInput {
  to: string;
  locale?: VoiceLocale;
  consentId: string;
  idempotencyKey: string;
  context: VoiceCallContext;
}

export interface VoiceCallResult {
  provider: 'twilio';
  providerCallId: string;
  status: string;
}

export interface TransferCallInput {
  providerCallId: string;
  to: string;
  reason: string;
  idempotencyKey: string;
}

export interface ScheduleCallbackInput {
  to: string;
  scheduledFor: Date;
  timezone: string;
  consentId: string;
  idempotencyKey: string;
  context: VoiceCallContext;
}

export interface VoiceRequestVerificationInput {
  signature?: string;
  url: string;
  params?: Record<string, string>;
}

export interface VoiceProvider {
  readonly name: 'twilio';
  verifyRequest(input: VoiceRequestVerificationInput): boolean;
  startOutboundCall(input: StartOutboundVoiceCallInput): Promise<VoiceCallResult>;
  transferCall(input: TransferCallInput): Promise<VoiceCallResult>;
  endVoiceSession(providerCallId: string): Promise<VoiceCallResult>;
}

export class VoiceProviderError extends Error {
  constructor(
    public readonly code:
      | 'FEATURE_DISABLED'
      | 'INVALID_DESTINATION'
      | 'INVALID_SIGNATURE'
      | 'CONSENT_REQUIRED'
      | 'PROVIDER_FAILURE',
    message: string,
    public readonly retryable = false,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VoiceProviderError';
  }
}
