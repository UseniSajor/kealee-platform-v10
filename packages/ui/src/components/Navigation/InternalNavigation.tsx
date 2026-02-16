'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function useAuth() {
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState(null as {name:string;role:string}|null)
  useEffect(() => {
    try {
      const tk = document.cookie.split('; ').find(r=>r.startsWith('sb-access-token='))
      const t = tk ? tk.split('=')[1] : localStorage.getItem('sb-access-token')
      if(t){
        const p=JSON.parse(atob(t.split('.')[1]))
        setIsAuth(true)
        setUser({name:p.email||'User',role:p.user_role||p.role||'pm'})
      }
    } catch { setIsAuth(false); setUser(null) }
  }, [])
  return { isAuthenticated: isAuth, user }
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
          <Link href="/" className="flex items-center">
            <img
              src="/kealee-logo.png"
              alt="Kealee Construction"
              className="h-12 w-auto"
            />
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
