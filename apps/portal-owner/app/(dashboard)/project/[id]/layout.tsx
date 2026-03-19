'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Activity, CheckCircle, FileText } from 'lucide-react'

const PROJECT_NAV = [
  { segment: '',        label: 'Overview',   icon: Activity,      exact: true },
  { segment: 'concept', label: 'Concept',    icon: FileText },
  { segment: 'readiness', label: 'Readiness', icon: CheckCircle },
]

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const projectId = params?.id as string

  return (
    <div>
      {/* Project sub-nav */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {PROJECT_NAV.map((item) => {
            const href = `/project/${projectId}${item.segment ? `/${item.segment}` : ''}`
            const active = item.exact
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={item.segment}
                href={href}
                className="flex shrink-0 items-center gap-1.5 border-b-2 px-4 pb-3 text-sm font-medium transition-colors"
                style={{
                  borderColor: active ? '#2ABFBF' : 'transparent',
                  color: active ? '#2ABFBF' : '#6B7280',
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
