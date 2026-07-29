import { getRedisClient } from '@kealee/redis'

export type IntegrationStatus = 'operational' | 'degraded' | 'not_configured'

export interface IntegrationHealth {
  name: string
  key: string
  category: string
  status: IntegrationStatus
  latencyMs: number
}

interface HttpCheck {
  name: string
  key: string
  category: string
  url: string
  configured: boolean
  headers?: HeadersInit
}

async function checkHttp(check: HttpCheck, timeoutMs = 4000): Promise<IntegrationHealth> {
  if (!check.configured) {
    return { ...check, status: 'not_configured', latencyMs: 0 }
  }

  const start = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(check.url, {
      headers: check.headers,
      signal: controller.signal,
      cache: 'no-store',
    })
    return {
      name: check.name,
      key: check.key,
      category: check.category,
      status: response.ok ? 'operational' : 'degraded',
      latencyMs: Date.now() - start,
    }
  } catch {
    return {
      name: check.name,
      key: check.key,
      category: check.category,
      status: 'degraded',
      latencyMs: Date.now() - start,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function checkRedis(): Promise<IntegrationHealth> {
  const base = { name: 'Redis', key: 'redis', category: 'Cache & Queue' }
  if (!process.env.REDIS_URL) return { ...base, status: 'not_configured', latencyMs: 0 }

  const start = Date.now()
  try {
    const redis = await getRedisClient()
    return {
      ...base,
      status: await redis.ping() ? 'operational' : 'degraded',
      latencyMs: Date.now() - start,
    }
  } catch {
    return { ...base, status: 'degraded', latencyMs: Date.now() - start }
  }
}

export async function checkPlatformIntegrations(): Promise<IntegrationHealth[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? ''
  const resendKey = process.env.RESEND_API_KEY ?? ''
  const twilioSid = process.env.TWILIO_ACCOUNT_SID ?? ''
  const twilioToken = process.env.TWILIO_AUTH_TOKEN ?? ''
  const ghlKey = process.env.GHL_API_KEY ?? ''
  const ghlLocation = process.env.GHL_LOCATION_ID ?? ''

  return Promise.all([
    checkHttp({
      name: 'Stripe',
      key: 'stripe',
      category: 'Payments',
      url: 'https://api.stripe.com/v1/balance',
      configured: Boolean(stripeKey),
      headers: { Authorization: `Bearer ${stripeKey}` },
    }),
    checkHttp({
      name: 'Supabase',
      key: 'supabase',
      category: 'Auth & Database',
      url: `${supabaseUrl}/rest/v1/`,
      configured: Boolean(supabaseUrl && supabaseKey),
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    }),
    checkHttp({
      name: 'Anthropic (Claude)',
      key: 'anthropic',
      category: 'AI',
      url: 'https://api.anthropic.com/v1/models?limit=1',
      configured: Boolean(anthropicKey),
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    }),
    checkHttp({
      name: 'Resend',
      key: 'resend',
      category: 'Email',
      url: 'https://api.resend.com/domains?limit=1',
      configured: Boolean(resendKey),
      headers: { Authorization: `Bearer ${resendKey}` },
    }),
    checkHttp({
      name: 'Twilio',
      key: 'twilio',
      category: 'SMS',
      url: `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`,
      configured: Boolean(twilioSid && twilioToken),
      headers: { Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}` },
    }),
    checkHttp({
      name: 'GoHighLevel',
      key: 'ghl',
      category: 'CRM',
      url: `https://services.leadconnectorhq.com/locations/${ghlLocation}`,
      configured: Boolean(ghlKey && ghlLocation),
      headers: { Authorization: `Bearer ${ghlKey}`, Version: '2021-07-28' },
    }),
    checkRedis(),
  ])
}
