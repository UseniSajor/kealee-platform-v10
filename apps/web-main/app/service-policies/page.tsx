import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Delivery, Revisions, Cancellations & Refunds | Kealee',
  description: 'How Kealee handles delivery timing, revisions, cancellations, refunds, and professional review.',
}

const policies = [
  {
    title: 'Delivery timing',
    body: 'The delivery window shown at checkout begins after payment and receipt of the required project information and files. Missing, unreadable, or materially incomplete inputs pause the delivery window. Agency review times, professional schedules, site access, and customer response times are outside Kealee’s delivery window.',
  },
  {
    title: 'AI concepts and planning estimates',
    body: 'AI concepts, preliminary layouts, permit-path summaries, and planning estimates are decision-support documents. They are not construction documents, professional certifications, contractor bids, agency determinations, or guarantees of final cost.',
  },
  {
    title: 'Professional review',
    body: 'A licensed or certified professional review is included only when the project agreement explicitly identifies the professional of record, review scope, jurisdiction, license information, insurance status, and signed or sealed deliverable. A matched professional becomes the professional of record only after the project owner and professional accept that engagement. Kealee does not imply a stamp, seal, certification, lender acceptance, or permit readiness through a planning-level package.',
  },
  {
    title: 'Revisions',
    body: 'Included revisions are limited to the count and scope displayed at checkout. Corrections needed because Kealee did not follow the submitted brief do not consume a revision. New rooms, new project areas, changed measurements, changed property conditions, or a substantially different design direction are additional scope.',
  },
  {
    title: 'Cancellations and refunds',
    body: 'A customized digital service may be cancelled for a full refund before production begins. After production begins, completed work and committed third-party costs are non-refundable. Permit filing fees, professional fees, site visits, and jurisdiction fees become non-refundable when committed or submitted. Technical non-delivery will be corrected, re-delivered, or refunded as appropriate.',
  },
  {
    title: 'Marketplace engagements',
    body: 'Marketplace providers are independent businesses unless the project agreement expressly identifies Kealee Construction LLC as the contracting party. The agreement must identify the contractor or professional of record and the applicable scope, license, insurance, exclusions, payment terms, and warranty before regulated work begins. Payment protection is available only when explicitly enabled for the engagement.',
  },
]

export default function ServicePoliciesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="text-3xl font-bold">Delivery, Revisions, Cancellations & Refunds</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        These operating policies explain how public service promises are applied. The package description
        and checkout summary control if they provide more specific terms.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7">
        {policies.map((policy) => (
          <section key={policy.title}>
            <h2 className="text-lg font-semibold">{policy.title}</h2>
            <p className="mt-2">{policy.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
        Questions about an order? Contact{' '}
        <a className="font-semibold text-orange-600 underline" href="mailto:hello@kealee.com">
          hello@kealee.com
        </a>
        . Also review the <Link className="text-orange-600 underline" href="/terms">Terms of Service</Link>.
      </p>
    </main>
  )
}
