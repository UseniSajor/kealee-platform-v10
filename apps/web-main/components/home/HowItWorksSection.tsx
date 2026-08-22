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
    a: 'Yes. Kealee gets you permits by preparing your permit package, coordinating with the jurisdiction, and managing the filing process with you from start to finish.',
  },
  {
    q: 'Is a Kealee concept the same as architectural drawings?',
    a: 'A Kealee concept gives you clear preliminary design direction for deciding on scope, budget, and next steps. When your project needs stamped drawings, we coordinate that service separately with the right licensed professional.',
  },
  {
    q: 'Is the estimate a bid?',
    a: 'A Kealee estimate is a documented, priced opinion built from the scope and assumptions in your report, giving you a clear planning number for your project and next conversations with contractors.',
  },
  {
    q: 'What if I only have an address and an idea?',
    a: 'An address and an idea are enough to start. Kealee turns your starting information into a clear project package, then incorporates plans, photos, or a survey as you add them.',
  },
  {
    q: 'How does Kealee support my order?',
    a: 'Your order is monitored by our team, with live status updates on your order page and direct contact whenever a person needs to help move it forward. We stand behind the deliverables you purchase.',
  },
  {
    q: 'Who can see my documents?',
    a: 'Your documents stay connected to your order record and are available through your secure emailed link or your signed-in Kealee account.',
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
