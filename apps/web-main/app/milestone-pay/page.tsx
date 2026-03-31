import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, DollarSign, FileText, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Milestone Pay — Escrow-Protected Construction Payments | Kealee',
  description: 'How milestone-based escrow payments protect homeowners and contractors. Funds release only when each project phase is verified complete.',
}

const STEPS = [
  {
    number: '01',
    icon: DollarSign,
    title: 'Funds Go Into Escrow',
    desc: 'Before work begins, the agreed project amount is deposited into a secure escrow account — held by a neutral third party, not your contractor.',
    color: '#2ABFBF',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Milestones Are Defined',
    desc: 'Your project is broken into verified phases: foundation, framing, rough-in, drywall, finish, and final inspection. Each has a defined deliverable and payment amount.',
    color: '#E8793A',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'You Approve Each Phase',
    desc: 'When a milestone is complete, you review the work and approve payment release. Funds transfer to your contractor only after your sign-off — not before.',
    color: '#38A169',
  },
  {
    number: '04',
    icon: Shield,
    title: 'Closeout & Final Release',
    desc: 'Final payment releases only after punch list sign-off, lien waivers are collected, and you confirm project completion. Your money is protected until the very end.',
    color: '#7C3AED',
  },
]

const PROTECTIONS = [
  {
    title: 'No prepayment to contractors',
    desc: 'Your contractor never receives payment in advance. Work must be completed and approved before any funds move.',
  },
  {
    title: 'Lien waiver collection',
    desc: 'We collect lien waivers at each payment milestone to protect your property from mechanics lien claims.',
  },
  {
    title: 'Dispute hold period',
    desc: 'If a dispute arises, funds are frozen and held until resolution — protecting both parties during any disagreement.',
  },
  {
    title: 'Full payment audit trail',
    desc: 'Every payment, approval, and milestone sign-off is recorded and time-stamped in your Owner Portal.',
  },
]

export default function MilestonePayPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A4A2B 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ backgroundColor: 'rgba(56,161,105,0.15)', color: '#68D391' }}
          >
            <Shield className="h-3.5 w-3.5" />
            Escrow-Protected Payments
          </div>
          <h1 className="text-4xl font-bold text-white font-display sm:text-5xl">
            Your money moves only when the work is done
          </h1>
          <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Milestone-based escrow payments eliminate the risk of overpaying for incomplete work.
            Funds are held securely and released in stages — only after you approve each phase.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#38A169' }}
            >
              Start Your Project <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contractors"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:border-white/50 transition-all"
            >
              Contractor Network
            </Link>
          </div>
        </div>
      </section>

      {/* 4-step flow */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              How milestone payments work
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Four stages. Every payment protected. No surprises.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(step => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl bg-white p-6"
                  style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)', border: '1px solid #E5E7EB' }}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${step.color}14` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: step.color }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: step.color }}>
                    Step {step.number}
                  </p>
                  <h3 className="font-bold mb-2" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Flow connector visual */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {['Funds in Escrow', 'Milestones Set', 'Phase Approval', 'Final Release'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="flex h-8 items-center rounded-full px-4 text-xs font-semibold text-white"
                  style={{ backgroundColor: ['#2ABFBF', '#E8793A', '#38A169', '#7C3AED'][i] }}
                >
                  {label}
                </div>
                {i < 3 && <ArrowRight className="h-4 w-4 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection features */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Built-in financial protections
            </h2>
            <p className="mt-3 text-gray-500">
              Every project on Kealee includes these protections automatically.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {PROTECTIONS.map(item => (
              <div
                key={item.title}
                className="flex gap-4 rounded-xl bg-white p-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#1A2B4A' }}>{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lien waiver explainer */}
      <section className="py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl border border-yellow-200 p-6"
            style={{ backgroundColor: 'rgba(255,215,0,0.05)' }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#1A2B4A' }}>
                  Why lien waivers matter
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  When a contractor or subcontractor is paid, they sign a lien waiver releasing their
                  right to file a mechanics lien against your property. Without lien waivers at each
                  payment, a contractor who was underpaid by their subcontractor could legally place a
                  lien on your home — even if you paid in full. Kealee collects conditional and
                  unconditional lien waivers at every milestone payment as part of the escrow process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white font-display">
            Build with financial protection from day one
          </h2>
          <p className="mt-3 text-gray-300">
            Every Kealee project includes milestone escrow automatically — no add-ons, no surprises.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start Your Project <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contractors"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-500 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-300 hover:text-white"
            >
              Contractor Network
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
