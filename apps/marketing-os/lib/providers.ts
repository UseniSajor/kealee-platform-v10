export interface ProviderHealth {
  provider: string
  category: 'video' | 'voice' | 'social' | 'automation' | 'ai'
  configured: boolean
  capability: string
}

export function getProviderHealth(): ProviderHealth[] {
  return [
    { provider: 'OpenAI', category: 'ai', configured: Boolean(process.env.OPENAI_API_KEY), capability: 'Agent reasoning and structured generation' },
    { provider: 'Runway', category: 'video', configured: Boolean(process.env.RUNWAY_API_KEY), capability: 'Text/image-to-video' },
    { provider: 'Kling via Replicate', category: 'video', configured: Boolean(process.env.REPLICATE_API_TOKEN), capability: 'Image-to-video and social clips' },
    { provider: 'Google Veo', category: 'video', configured: Boolean(process.env.GEMINI_API_KEY), capability: 'Video generation with audio' },
    { provider: 'ElevenLabs', category: 'voice', configured: Boolean(process.env.ELEVENLABS_API_KEY), capability: 'Narration and voiceovers' },
    { provider: 'YouTube', category: 'social', configured: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET), capability: 'Video publishing and analytics' },
    { provider: 'Meta', category: 'social', configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET), capability: 'Instagram and Facebook publishing' },
    { provider: 'LinkedIn', category: 'social', configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET), capability: 'Organization publishing and analytics' },
    { provider: 'TikTok', category: 'social', configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET), capability: 'Video publishing and analytics' },
    { provider: 'Trigger.dev', category: 'automation', configured: Boolean(process.env.TRIGGER_SECRET_KEY), capability: 'Durable scheduled orchestration' },
    { provider: 'n8n', category: 'automation', configured: Boolean(process.env.N8N_BASE_URL && process.env.MARKETING_OS_N8N_WEBHOOK_SECRET), capability: 'External workflow and webhook automation' },
  ]
}

export function requireProvider(provider: string, envKeys: string[]) {
  const missing = envKeys.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`${provider} is not configured. Missing: ${missing.join(', ')}`)
}
