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
  Settings as SettingsIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
    <div className={cn('flex h-full w-64 flex-col bg-gray-900', className)}>
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Kealee Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
