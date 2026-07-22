import type { FastifyInstance, FastifyRequest } from 'fastify';
import { buildConversationRelayTwiML, TwilioVoiceProvider } from '@kealee/communications';
import { getAiAutomationConfig } from '@kealee/core-config';

function publicRequestUrl(request: FastifyRequest): string {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0]?.trim()
    ?? request.protocol;
  const forwardedHost = request.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)?.split(',')[0]?.trim()
    ?? request.headers.host;
  if (!host) throw new Error('Request host is unavailable');
  return `${proto}://${host}${request.url}`;
}

function bodyParams(body: unknown): Record<string, string> {
  if (!body || typeof body !== 'object') return {};
  return Object.fromEntries(Object.entries(body as Record<string, unknown>)
    .filter(([, value]) => typeof value === 'string') as Array<[string, string]>);
}

export async function voiceRoutes(fastify: FastifyInstance) {
  const config = getAiAutomationConfig();

  fastify.get('/health', async (_request, reply) => reply.send({
    enabled: config.aiVoiceEnabled,
    outboundEnabled: config.aiOutboundCallingEnabled,
    recordingEnabled: config.twilioRecordingEnabled,
    provider: config.aiVoiceEnabled ? 'twilio' : null,
  }));

  fastify.post('/inbound', { config: { rawBody: true } }, async (request, reply) => {
    if (!config.aiVoiceEnabled) return reply.status(503).send({ error: 'AI voice is disabled' });
    const provider = new TwilioVoiceProvider({
      accountSid: config.twilioAccountSid!, authToken: config.twilioAuthToken!,
      voiceNumber: config.twilioVoiceNumber!, conversationRelayUrl: config.twilioConversationRelayUrl!,
      statusCallbackUrl: config.twilioStatusCallbackUrl!, outboundCallingEnabled: config.aiOutboundCallingEnabled,
    });
    const signature = request.headers['x-twilio-signature'];
    const valid = provider.verifyRequest({
      signature: Array.isArray(signature) ? signature[0] : signature,
      url: publicRequestUrl(request), params: bodyParams(request.body),
    });
    if (!valid) return reply.status(403).send({ error: 'Invalid Twilio signature' });

    const disclosure = config.twilioRecordingEnabled
      ? 'This call may be recorded and uses an AI assistant. You can ask for a person at any time.'
      : 'You are speaking with an AI assistant. You can ask for a person at any time.';
    const twiml = buildConversationRelayTwiML({
      websocketUrl: config.twilioConversationRelayUrl!,
      recordingDisclosure: disclosure,
      welcomeGreeting: 'Thank you for calling Kealee. How can I help with your property or project?',
      language: 'en-US', interruptible: true,
    });
    return reply.type('text/xml; charset=utf-8').send(twiml);
  });

  fastify.post('/status', { config: { rawBody: true } }, async (request, reply) => {
    if (!config.aiVoiceEnabled) return reply.status(503).send({ error: 'AI voice is disabled' });
    const provider = new TwilioVoiceProvider({
      accountSid: config.twilioAccountSid!, authToken: config.twilioAuthToken!,
      voiceNumber: config.twilioVoiceNumber!, conversationRelayUrl: config.twilioConversationRelayUrl!,
      statusCallbackUrl: config.twilioStatusCallbackUrl!, outboundCallingEnabled: config.aiOutboundCallingEnabled,
    });
    const signature = request.headers['x-twilio-signature'];
    if (!provider.verifyRequest({ signature: Array.isArray(signature) ? signature[0] : signature,
      url: publicRequestUrl(request), params: bodyParams(request.body) })) {
      return reply.status(403).send({ error: 'Invalid Twilio signature' });
    }
    const status = bodyParams(request.body);
    fastify.log.info({
      event: 'voice.call.status',
      providerCallId: status.CallSid,
      callStatus: status.CallStatus,
      sequenceNumber: status.SequenceNumber,
    }, 'Twilio call status');
    return reply.status(204).send();
  });
}
