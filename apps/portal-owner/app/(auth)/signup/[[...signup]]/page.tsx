import { SignUp } from '@clerk/nextjs'

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/deliverables'
  return value
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string; email?: string }
}) {
  const nextPath = safeNextPath(searchParams.next)
  const email = searchParams.email?.trim() ?? ''

  return (
    <SignUp
      path="/signup"
      routing="path"
      signInUrl={`/login?next=${encodeURIComponent(nextPath)}${email ? `&email=${encodeURIComponent(email)}` : ''}`}
      forceRedirectUrl={nextPath}
      fallbackRedirectUrl={nextPath}
      initialValues={email ? { emailAddress: email } : undefined}
    />
  )
}
