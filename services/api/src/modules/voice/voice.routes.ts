import type { FastifyInstance, FastifyRequest } from 'fastify';
import { buildConversationRelayTwiML, TwilioVoiceProvider } from '@kealee/communications';
import { ConversationRelaySessionController } from '@kealee/communications';
import { getAiAutomationConfig } from '@kealee/core-config';
import { prisma } from '@kealee/database';
import { createHash } from 'crypto';
import { chat } from '../keabot/keabot-engine';

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
  const database = prisma as any;

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

  if (config.aiVoiceEnabled) {
    // Loaded only when the feature is enabled so disabled deployments remain independent.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const websocketPlugin = require('@fastify/websocket');
    await fastify.register(websocketPlugin);

    fastify.get('/conversation-relay', { websocket: true } as any, (socket: any, request: FastifyRequest) => {
      const provider = new TwilioVoiceProvider({
        accountSid: config.twilioAccountSid!, authToken: config.twilioAuthToken!,
        voiceNumber: config.twilioVoiceNumber!, conversationRelayUrl: config.twilioConversationRelayUrl!,
        statusCallbackUrl: config.twilioStatusCallbackUrl!, outboundCallingEnabled: config.aiOutboundCallingEnabled,
      });
      const signature = request.headers['x-twilio-signature'];
      if (!provider.verifyRequest({
        signature: Array.isArray(signature) ? signature[0] : signature,
        url: publicRequestUrl(request), params: {},
      })) {
        socket.close(1008, 'Invalid Twilio signature');
        return;
      }

      let callSid: string | undefined;
      const controller = new ConversationRelaySessionController({
        async onSetup(message) {
          if (message.accountSid !== config.twilioAccountSid) throw new Error('Twilio account mismatch');
          callSid = message.callSid;
          await database.aiCommunicationSession.upsert({
            where: { providerSessionId: message.sessionId },
            create: {
              provider: 'twilio', providerSessionId: message.sessionId, channel: 'VOICE',
              direction: String(message.direction).toUpperCase(), status: 'ACTIVE', locale: 'en-US',
              recordingEnabled: config.twilioRecordingEnabled, disclosureVersion: 'voice-ai-v1',
              startedAt: new Date(), metadata: { callSid: message.callSid, callType: (message as any).callType },
            },
            update: { status: 'ACTIVE', startedAt: new Date(), metadata: { callSid: message.callSid } },
          });
        },
        async *onPrompt(text, context) {
          const response = await chat(context.sessionId, text);
          yield response.message;
        },
        async onTranscript(artifact) {
          const contentHash = createHash('sha256')
            .update(`${artifact.role}:${artifact.final}:${artifact.text}`).digest('hex');
          await database.aiConversationArtifact.upsert({
            where: { sessionId_artifactType_contentHash: {
              sessionId: artifact.sessionId, artifactType: artifact.role, contentHash,
            } },
            create: {
              sessionId: artifact.sessionId, artifactType: artifact.role, redactedBody: artifact.text,
              contentHash, metadata: { final: artifact.final, redacted: artifact.redacted },
            },
            update: {},
          });
        },
        async onInterrupt(message) {
          fastify.log.info({ event: 'voice.interrupt', callSid,
            durationUntilInterruptMs: message.durationUntilInterruptMs }, 'Caller interrupted AI speech');
        },
        async onError(description) {
          fastify.log.warn({ event: 'voice.relay.error', callSid, description }, 'ConversationRelay error');
        },
      });

      let processing = Promise.resolve();
      socket.on('message', (payload: Buffer | string) => {
        processing = processing.then(async () => {
          for await (const outbound of controller.handle(payload.toString())) socket.send(JSON.stringify(outbound));
        }).catch((error: Error) => {
          fastify.log.error({ event: 'voice.relay.failure', callSid, error: error.message }, 'ConversationRelay session failed');
          socket.close(1011, 'Voice session failed');
        });
      });
      socket.on('close', () => {
        if (!callSid) return;
        database.aiCommunicationSession.updateMany({
          where: { metadata: { path: ['callSid'], equals: callSid } },
          data: { status: 'COMPLETED', endedAt: new Date() },
        }).catch((error: Error) => fastify.log.error({ event: 'voice.persistence.failure', callSid,
          error: error.message }, 'Unable to close voice session record'));
      });
    });
  }
}
