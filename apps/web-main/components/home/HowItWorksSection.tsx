import Link from 'next/link'
import { ShieldCheck, UserCheck, FileSearch, Eye } from 'lucide-react'

const STEPS = [
  {
    n: '1',
    title: 'Tell us about the property',
    body: 'Enter the address and project type. We identify the state, county, and city, and show you the data coverage for that location before you pay.',
  },
  {
    n: '2',
    title: 'Upload what you have',
    body: 'Plans, photos, surveys, or a solicitation package. Nothing is required — we tell you what is missing and what each missing item costs you in accuracy.',
  },
  {
    n: '3',
    title: 'Get your missing-information checklist',
    body: 'Before you commit, you see exactly what we have, what we still need, and what we will assume if it never arrives.',
  },
  {
    n: '4',
    title: 'Pay or request pricing',
    body: 'Fixed-price products check out online. Scope-dependent work goes through a quote request instead — you are never charged before scope is agreed.',
  },
  {
    n: '5',
    title: 'We produce the deliverable',
    body: 'Automated where the data supports it, by hand where it does not. Your order page shows the live status and who it is waiting on.',
  },
  {
    n: '6',
    title: 'Review, download, continue',
    body: 'You get an email when the package is released, with every assumption and source listed — then the next preconstruction product if you want it.',
  },
]

const TRUST = [
  {
    icon: FileSearch,
    title: 'Every number has a source',
    body: 'Assumptions, source, data date, and confidence are attached to every generated result. Unknowns are listed as unknowns, never filled in.',
  },
  {
    icon: UserCheck,
    title: 'Humans in the loop by design',
    body: 'Where jurisdiction data is thin or the stakes are high, a Kealee reviewer works the order by hand. You can see the review status on your order page.',
  },
  {
    icon: ShieldCheck,
    title: 'We do not overstate what we are',
    body: 'Kealee output is preconstruction planning work. It is not an architectural, engineering, legal, code, or jurisdictional approval, and we say so on every deliverable.',
  },
  {
    icon: Eye,
    title: 'Failures are visible',
    body: 'If automation cannot complete your order, it is routed to a person and the status says so. Paid orders are never left silently unfinished.',
  },
]

const FAQ = [
  {
    q: 'Do you work in my state?',
    a: 'Yes. All four products are available in all 50 states and DC. What varies is how much of the jurisdiction research is automated. Where we have no automated data source, we do the research manually and label the result "Manual review required".',
  },
  {
    q: 'Can Kealee get my permit approved?',
    a: 'No. Kealee prepares permit packages, coordinates with the agency, and assists with filing. Only the jurisdiction issues a permit. We cannot guarantee approval, fees, or timelines, and we will not tell you otherwise.',
  },
  {
    q: 'Is a Kealee concept the same as architectural drawings?',
    a: 'No. Concepts are preliminary design direction to help you decide on scope and budget. They are not construction documents and do not replace a licensed architect or engineer. When your project needs stamped drawings, we say so and can coordinate that separately.',
  },
  {
    q: 'Is the estimate a bid?',
    a: 'No. It is a documented, priced opinion based on the scope and assumptions listed in the report. It is not a contract price and does not commit any contractor to build at that number.',
  },
  {
    q: 'What if I only have an address and an idea?',
    a: 'That is enough to start. We will tell you what we can determine from public data, what we are assuming, and what would need to be confirmed. You can add plans or a survey later and we will update the package.',
  },
  {
    q: 'What if you cannot complete my order?',
    a: 'It goes to a person, the status on your order page changes to reflect that, and we contact you. If we genuinely cannot deliver what you paid for, we refund it.',
  },
  {
    q: 'Who can see my documents?',
    a: 'Your order and uploads are tied to your order record and reachable only through your own emailed link or a signed-in account matching the email on the order.',
  },
]

export function HowItWorksSection() {
  return (
    <>
      <section id="how-it-works" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
              From an address to a deliverable
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(step => (
              <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-sm font-black text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="trust" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Trust &amp; quality control
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
              How we keep AI output honest
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {TRUST.map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 p-6">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-slate-950">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-6">
                <dt className="font-bold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-600">
              Questions we have not answered?{' '}
              <Link href="/contact" className="font-semibold text-orange-700 underline">
                Contact support
              </Link>
              .
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Kealee uses AI to accelerate research, drafting, and visualization. AI output is always
              labelled with its assumptions, sources, confidence, and review status, and is reviewed
              by a person before release wherever a deliverable depends on jurisdiction-specific
              facts. Read our{' '}
              <Link href="/terms" className="underline">terms</Link>,{' '}
              <Link href="/privacy" className="underline">privacy policy</Link>, and{' '}
              <Link href="/terms#refunds" className="underline">refund policy</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
