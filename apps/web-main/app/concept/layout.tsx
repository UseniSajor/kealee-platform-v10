'use client'

import { usePathname } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  { n: 1, label: 'Service', paths: ['/concept'] },
  { n: 2, label: 'Details', paths: ['/concept/details'] },
  { n: 3, label: 'Contact', paths: ['/concept/contact'] },
  { n: 4, label: 'Confirm', paths: ['/concept/confirm'] },
]

function ConceptProgressBar() {
  const pathname = usePathname()

  const currentStep = STEPS.findIndex((s) => s.paths.includes(pathname)) + 1 || 0

  // Don't show progress bar on deliverable pages
  if (currentStep === 0) return null

  return (
    <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const done = currentStep > step.n
            const active = currentStep === step.n
            return (
              <div key={step.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done
                        ? 'bg-[#E8724B] text-white'
                        : active
                        ? 'bg-[#E8724B] text-white ring-4 ring-orange-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 hidden sm:block ${
                      active ? 'text-[#E8724B]' : done ? 'text-[#E8724B]' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 mb-4 rounded-full transition-all ${
                      done ? 'bg-[#E8724B]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isConfirm = pathname === '/concept/confirm'
  return (
    <div className="min-h-screen bg-slate-50">
      <ConceptProgressBar />
      <div className={`mx-auto px-4 py-10 lg:py-14 ${isConfirm ? 'max-w-6xl' : 'max-w-3xl'}`}>
        {children}
      </div>
    </div>
  )
}

export default function ConceptLayout({ children }: { children: React.ReactNode }) {
  return <LayoutInner>{children}</LayoutInner>
}
