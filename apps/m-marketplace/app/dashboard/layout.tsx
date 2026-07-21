'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { signOut } from '@kealee/auth/client'
import { useRouter } from 'next/navigation'
import { DashboardNotifications } from '@/components/DashboardNotifications'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'My Orders', icon: Package },
  { href: '/dashboard/projects', label: 'My Projects', icon: FolderKanban },
  { href: '/dashboard/account', label: 'Account', icon: User },
  { href: '/dashboard/support', label: 'Support', icon: HelpCircle },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch {
      // ignore
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard header with notifications */}
          <div className="flex items-center justify-between mb-6">
            <div />
            <DashboardNotifications />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <nav className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all w-full"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
