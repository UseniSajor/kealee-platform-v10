import twilio from 'twilio';
import type {
  StartOutboundVoiceCallInput,
  TransferCallInput,
  VoiceCallResult,
  VoiceProvider,
  VoiceRequestVerificationInput,
} from './types';
import { VoiceProviderError } from './types';

const E164 = /^\+[1-9]\d{1,14}$/;

export interface TwilioVoiceProviderConfig {
  accountSid: string;
  authToken: string;
  voiceNumber: string;
  conversationRelayUrl: string;
  statusCallbackUrl: string;
  outboundCallingEnabled: boolean;
}

function assertE164(value: string, label: string): void {
  if (!E164.test(value)) {
    throw new VoiceProviderError('INVALID_DESTINATION', `${label} must use E.164 format`);
  }
}

/** Twilio transport only. Consent, quiet-hour, and suppression policy is enforced by its caller. */
export class TwilioVoiceProvider implements VoiceProvider {
  readonly name = 'twilio' as const;
  private readonly client: twilio.Twilio;

  constructor(private readonly config: TwilioVoiceProviderConfig) {
    assertE164(config.voiceNumber, 'TWILIO_VOICE_NUMBER');
    this.client = twilio(config.accountSid, config.authToken);
  }

  verifyRequest(input: VoiceRequestVerificationInput): boolean {
    if (!input.signature) return false;
    return twilio.validateRequest(
      this.config.authToken,
      input.signature,
      input.url,
      input.params ?? {},
    );
  }

  async startOutboundCall(input: StartOutboundVoiceCallInput): Promise<VoiceCallResult> {
    if (!this.config.outboundCallingEnabled) {
      throw new VoiceProviderError('FEATURE_DISABLED', 'AI outbound calling is disabled');
    }
    if (!input.consentId) {
      throw new VoiceProviderError('CONSENT_REQUIRED', 'Outbound calls require recorded consent');
    }
    assertE164(input.to, 'Destination');

    try {
      const call = await this.client.calls.create({
        to: input.to,
        from: this.config.voiceNumber,
        url: this.config.conversationRelayUrl,
        statusCallback: this.config.statusCallbackUrl,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        method: 'POST',
      });
      return { provider: 'twilio', providerCallId: call.sid, status: call.status };
    } catch (cause) {
      throw new VoiceProviderError('PROVIDER_FAILURE', 'Twilio failed to start the call', true, cause);
    }
  }

  async transferCall(input: TransferCallInput): Promise<VoiceCallResult> {
    assertE164(input.to, 'Transfer destination');
    try {
      const call = await this.client.calls(input.providerCallId).update({
        twiml: `<Response><Dial>${input.to}</Dial></Response>`,
      });
      return { provider: 'twilio', providerCallId: call.sid, status: call.status };
    } catch (cause) {
      throw new VoiceProviderError('PROVIDER_FAILURE', 'Twilio failed to transfer the call', true, cause);
    }
  }

  async endVoiceSession(providerCallId: string): Promise<VoiceCallResult> {
    try {
      const call = await this.client.calls(providerCallId).update({ status: 'completed' });
      return { provider: 'twilio', providerCallId: call.sid, status: call.status };
    } catch (cause) {
      throw new VoiceProviderError('PROVIDER_FAILURE', 'Twilio failed to end the call', true, cause);
    }
  }
}
