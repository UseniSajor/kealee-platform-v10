'use client'

import { useAuth, useSession } from '@clerk/nextjs'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { session } = useSession()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  if (requiredRole) {
    const claims = session?.lastActiveToken?.jwt?.claims as Record<string, unknown> | null | undefined
    const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>
    const role = String(metadata.role ?? '').toLowerCase()
    const required = requiredRole.toLowerCase()
    if (role !== required && !(required === 'admin' && role === 'super_admin')) return null
  }

  return <>{children}</>
}
