import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface RoleOptionProps {
  icon:        React.ReactNode
  label:       string
  description: string
  href:        string
  accent:      string
  onClick?:    () => void
}

export function RoleOption({ icon, label, description, href, accent, onClick }: RoleOptionProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-current hover:shadow-sm"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accent}15` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold transition-colors group-hover:text-current" style={{ color: '#1A2B4A' }}>
          {label}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight
        className="h-4 w-4 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5"
        style={{ color: accent }}
      />
    </Link>
  )
}
