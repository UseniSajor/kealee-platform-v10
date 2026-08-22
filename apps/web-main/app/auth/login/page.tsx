import { redirect } from 'next/navigation'

function safeNext(raw?: string): string {
  if (!raw) return '/'
  if (raw.startsWith('/')) return raw
  try {
    const url = new URL(raw)
    if (url.hostname === 'localhost' || url.hostname.endsWith('.kealee.com')) return raw
  } catch {
    // Invalid and external destinations fall back to the site root.
  }
  return '/'
}

export default function LegacyAuthLogin({
  searchParams,
}: {
  searchParams: { next?: string; redirectTo?: string }
}) {
  const next = safeNext(searchParams.next ?? searchParams.redirectTo)
  redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`)
}
