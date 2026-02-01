'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Gavel,
  Bot,
  Activity,
  MapPinned,
  UsersRound,
  BarChart3,
  Settings as SettingsIcon,
  Boxes,
  UserCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Modules', href: '/modules', icon: Boxes },
  { name: 'Organizations', href: '/orgs', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Financials', href: '/financials', icon: DollarSign },
  { name: 'Disputes', href: '/disputes', icon: Gavel },
  { name: 'Automation', href: '/automation', icon: Bot },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Jurisdictions', href: '/jurisdictions', icon: MapPinned },
  { name: 'Project Managers', href: '/project-managers', icon: UsersRound },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('flex h-full w-20 flex-col bg-gray-900', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <Link
          href="/"
          className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          aria-label="Kealee Admin"
        >
          K
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative group flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              aria-label={item.name}
            >
              <item.icon className="h-5 w-5" />

              {/* Tooltip */}
              <div className="
                absolute left-full ml-3 px-3 py-1.5
                bg-white text-gray-900 text-sm font-medium
                rounded-lg whitespace-nowrap
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200
                z-50
                shadow-lg
              ">
                {item.name}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Avatar */}
      <div className="border-t border-gray-800 p-3 flex justify-center">
        <button className="relative group">
          <UserCircle2 className="h-10 w-10 text-gray-500 hover:text-gray-300 transition-colors" />

          {/* Tooltip */}
          <div className="
            absolute left-full ml-3 px-3 py-1.5
            bg-white text-gray-900 text-sm font-medium
            rounded-lg whitespace-nowrap
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200
            z-50
            shadow-lg
          ">
            Admin User
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
          </div>
        </button>
      </div>
    </div>
  )
}
