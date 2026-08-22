import { redirect } from 'next/navigation'

export default function LegacyAccountCompletion({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const next = searchParams.next?.startsWith('/') ? searchParams.next : '/'
  redirect(`/sign-up?redirect_url=${encodeURIComponent(next)}`)
}
