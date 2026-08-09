/**
 * Get the app base URL based on deployment environment.
 *
 * Priority:
 * 1. NEXT_PUBLIC_WEB_MAIN_URL (explicitly configured)
 * 2. NEXT_PUBLIC_APP_URL (app-wide config)
 * 3. RAILWAY_PUBLIC_DOMAIN (Railway preview/staging)
 * 4. VERCEL_URL (Vercel preview/staging)
 * 5. localhost:3000 (local development)
 */
export function getWebMainUrl(): string {
  if (process.env.NEXT_PUBLIC_WEB_MAIN_URL) {
    return process.env.NEXT_PUBLIC_WEB_MAIN_URL
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Railway preview domain
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  }

  // Vercel preview domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development
  return 'http://localhost:3000'
}
