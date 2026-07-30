import { redirect } from 'next/navigation'

// Retired: folded into /signin (single master sign-in page for owners, contractors,
// developers, and staff). Kept as a redirect so bookmarked/indexed links keep working.
export default function LoginPageRedirect({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; next?: string }
}) {
  const target = searchParams?.redirectTo ?? searchParams?.next
  if (target?.startsWith('/') && target.startsWith('/marketing/workspace')) {
    redirect('/marketing/login')
  }
  if (target?.startsWith('/') && target.startsWith('/admin/marketing')) {
    redirect(`/auth/login?next=${encodeURIComponent(target)}`)
  }
  redirect('/signin')
}
