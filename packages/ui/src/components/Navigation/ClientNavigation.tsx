'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mock auth hook - replace with actual implementation
function useAuth() {
  // TODO: Implement actual auth check
  return { isAuthenticated: false, user: null }
}

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'https://kealee.com'

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo + Back to Marketplace */}
          <div className="flex items-center gap-4">
            <Link
              href={marketplaceUrl}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <span>← Marketplace</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <Link href="/" className="text-xl font-bold text-blue-600">
              Kealee
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
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
                <Link
                  href="/logout"
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm hover:text-gray-900 transition ${
                    pathname === '/login'
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-600'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
