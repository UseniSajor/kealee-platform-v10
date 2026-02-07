'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { cn } from '@/lib/utils'
import {
  Activity,
  Gavel,
  CalendarCheck,
  FileText,
  Receipt,
  Shield,
  Wallet,
  MessageSquare,
  ListChecks,
  FileOutput,
  BrainCircuit,
  CalendarClock,
  ScanSearch,
  Scale,
  LayoutDashboard,
} from 'lucide-react'

const APP_SECTIONS = [
  {
    label: 'Core',
    apps: [
      { id: 'APP-01', name: 'Bid Engine', icon: Gavel },
      { id: 'APP-02', name: 'Visit Scheduler', icon: CalendarCheck },
      { id: 'APP-03', name: 'Change Order', icon: FileText },
      { id: 'APP-04', name: 'Report Generator', icon: Receipt },
    ],
  },
  {
    label: 'Operations',
    apps: [
      { id: 'APP-05', name: 'Permit Tracker', icon: Shield },
      { id: 'APP-06', name: 'Inspection Coord', icon: ScanSearch },
      { id: 'APP-07', name: 'Budget Tracker', icon: Wallet },
      { id: 'APP-08', name: 'Communication Hub', icon: MessageSquare },
    ],
  },
  {
    label: 'Workflows',
    apps: [
      { id: 'APP-09', name: 'Task Queue', icon: ListChecks },
      { id: 'APP-10', name: 'Document Gen', icon: FileOutput },
    ],
  },
  {
    label: 'AI Agents',
    apps: [
      { id: 'APP-11', name: 'Predictive Engine', icon: BrainCircuit },
      { id: 'APP-12', name: 'Smart Scheduler', icon: CalendarClock },
      { id: 'APP-13', name: 'QA Inspector', icon: ScanSearch },
      { id: 'APP-14', name: 'Decision Support', icon: Scale },
    ],
  },
  {
    label: 'Monitoring',
    apps: [
      { id: 'APP-15', name: 'Dashboard Monitor', icon: LayoutDashboard },
    ],
  },
]

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto shrink-0">
            <div className="p-4">
              <Link
                href="/command-center"
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  pathname === '/command-center'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Activity className="h-4 w-4" />
                Overview
              </Link>
            </div>

            {APP_SECTIONS.map((section) => (
              <div key={section.label} className="px-4 pb-3">
                <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {section.label}
                </h3>
                <nav className="space-y-0.5">
                  {section.apps.map((app) => {
                    const isActive = pathname === `/command-center/${app.id}`
                    const Icon = app.icon
                    return (
                      <Link
                        key={app.id}
                        href={`/command-center/${app.id}`}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate">{app.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
