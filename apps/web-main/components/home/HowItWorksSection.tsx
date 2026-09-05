import Link from 'next/link'
import { ShieldCheck, UserCheck, FileSearch, Eye } from 'lucide-react'

const STEPS = [
  {
    n: '1',
    title: 'Tell us about the property',
    body: 'Enter the property address and project type so we can tailor the package to your location, goals, and likely local requirements.',
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
    body: 'Our team prepares your package and keeps its progress visible on your order page from start to release.',
  },
  {
    n: '6',
    title: 'Review, download, continue',
    body: 'You get an email when the package is ready, along with clear recommendations and the next step for moving your project forward.',
  },
]

const TRUST = [
  {
    icon: FileSearch,
    title: 'Clear, documented deliverables',
    body: 'Your package explains the information used, the assumptions made, and anything that still needs confirmation before you proceed.',
  },
  {
    icon: UserCheck,
    title: 'Professional review when needed',
    body: 'When your project needs additional review or specialized input, Kealee identifies it and coordinates the right next step.',
  },
  {
    icon: ShieldCheck,
    title: 'We do not overstate what we are',
    body: 'Kealee output is preconstruction planning work. It is not an architectural, engineering, legal, code, or jurisdictional approval, and we say so on every deliverable.',
  },
  {
    icon: Eye,
    title: 'Visible progress and support',
    body: 'Your order page shows current progress, and our team contacts you directly if more information is needed to keep the work moving.',
  },
]

const FAQ = [
  {
    q: 'Do you work in my state?',
    a: 'Yes. Kealee serves all 50 states and the District of Columbia. Your package is tailored to the property location and local requirements, and we explain any additional documents or professional input needed for your project.',
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
              Clear work, reviewed with care
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
              Each Kealee package is prepared for planning and coordination. When your project needs
              licensed design, engineering, surveying, or jurisdictional approval, we identify that
              requirement and help coordinate the next step. Read our{' '}
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
