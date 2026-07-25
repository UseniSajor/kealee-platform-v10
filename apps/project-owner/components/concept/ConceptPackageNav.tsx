'use client'

import { useEffect, useState } from 'react'
import { FileText, Download } from 'lucide-react'
import {
  CONCEPT_PACKAGE_SECTIONS,
  CONCEPT_PACKAGE_PDF_PAGE_COUNT,
  type ConceptPackageSection,
} from '@/lib/concept-package-manifest'

interface Props {
  visibleSectionIds: string[]
  /** Prefer authenticated portal PDF route when intakeId is set */
  intakeId?: string
  pdfUrl?: string | null
  packageLabel?: string
}

export function ConceptPackageNav({ visibleSectionIds, intakeId, pdfUrl, packageLabel }: Props) {
  const pdfHref = intakeId ? `/api/concept/${intakeId}/pdf` : pdfUrl ?? null
  const [activeId, setActiveId] = useState<string>(visibleSectionIds[0] ?? 'package-overview')

  const sections = CONCEPT_PACKAGE_SECTIONS.filter((s) => visibleSectionIds.includes(s.id))

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[]

    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    )

    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [sections])

  function scrollTo(section: ConceptPackageSection) {
    const el = document.getElementById(section.id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(section.id)
    }
  }

  return (
    <nav
      className="rounded-2xl border border-slate-200 bg-white p-4 sticky top-6"
      aria-label="Concept package contents"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
        Package contents
      </p>
      {packageLabel && (
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{packageLabel}</p>
      )}

      <ol className="space-y-0.5 mb-4">
        {sections.map((section) => {
          const active = activeId === section.id
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollTo(section)}
                className={`w-full text-left rounded-lg px-2.5 py-2 text-sm transition ${
                  active
                    ? 'bg-teal-50 text-teal-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{section.label}</span>
                  {section.pdfPage != null && (
                    <span className="text-[10px] text-slate-400 shrink-0">p.{section.pdfPage}</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          PDF ({CONCEPT_PACKAGE_PDF_PAGE_COUNT} pages)
        </p>
        {pdfHref ? (
          <a
            href={pdfHref}
            target={intakeId ? undefined : '_blank'}
            rel={intakeId ? undefined : 'noopener noreferrer'}
            download={intakeId ? true : undefined}
            className="flex items-center justify-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8724B' }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Your PDF is being assembled to match this page order. Refresh in a few minutes.
          </p>
        )}
      </div>
    </nav>
  )
}
