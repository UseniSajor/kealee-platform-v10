'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mock auth hook - replace with actual implementation
function useAuth() {
  // TODO: Implement actual auth check
  return {
    isAuthenticated: true,
    user: { name: 'User', role: 'pm' },
  }
}

export function InternalNavigation() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()

  // CRITICAL: Internal apps should NOT have:
  // - Link to marketplace
  // - Public sign up
  // - Marketing content

  if (!isAuthenticated) {
    return null // Don't render nav if not authenticated
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo ONLY - NO marketplace link */}
          <Link href="/" className="text-xl font-bold text-blue-600">
            Kealee
          </Link>

          {/* Internal Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm hover:text-gray-900 transition ${
                pathname?.startsWith('/dashboard')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className={`text-sm hover:text-gray-900 transition ${
                pathname?.startsWith('/account')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Account
            </Link>
            <span className="text-sm text-gray-600">
              {user?.role === 'admin' ? 'Admin' : 'PM'} | {user?.name}
            </span>
            <Link
              href="/logout"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
