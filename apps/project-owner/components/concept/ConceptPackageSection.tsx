'use client'

import type { ReactNode } from 'react'

interface Props {
  id: string
  title: string
  subtitle?: string
  accent?: string
  pdfPage?: number | null
  children: ReactNode
  className?: string
}

/** Consistent section chrome + anchor id for package TOC. */
export function ConceptPackageSection({
  id,
  title,
  subtitle,
  accent = '#E8724B',
  pdfPage,
  children,
  className = '',
}: Props) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl bg-white overflow-hidden ${className}`}
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
          <h2 className="text-base font-bold truncate" style={{ color: '#1A2B4A' }}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pdfPage != null && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              PDF p.{pdfPage}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">{subtitle}</span>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}
