import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { voiceRoutes } from '../../modules/voice/voice.routes';

const originalVoice = process.env.AI_VOICE_ENABLED;
afterEach(() => {
  if (originalVoice === undefined) delete process.env.AI_VOICE_ENABLED;
  else process.env.AI_VOICE_ENABLED = originalVoice;
});

describe('voice routes fail closed', () => {
  it('reports disabled health without loading a provider', async () => {
    process.env.AI_VOICE_ENABLED = 'false';
    const app = Fastify();
    await app.register(voiceRoutes, { prefix: '/api/voice' });
    const response = await app.inject({ method: 'GET', url: '/api/voice/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ enabled: false, provider: null });
    await app.close();
  });

  it('rejects inbound calls while disabled', async () => {
    process.env.AI_VOICE_ENABLED = 'false';
    const app = Fastify();
    await app.register(voiceRoutes, { prefix: '/api/voice' });
    const response = await app.inject({ method: 'POST', url: '/api/voice/inbound', payload: {} });
    expect(response.statusCode).toBe(503);
    await app.close();
  });
});
