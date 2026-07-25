import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Kealee Project Owner',
  description: 'Privacy policy for the Kealee Project Owner web and Android applications.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-800">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <Link href="/projects" className="text-sm font-semibold text-teal-700">
          ← Kealee Project Owner
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Effective July 24, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7">
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Information we process</h2>
            <p>
              Kealee processes account and contact information, project details, property
              addresses, construction documents, messages, estimates, payments and transaction
              references, and files or photos that you choose to upload. With permission, the
              Android application may process device location for property and site-plan features.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-950">How information is used</h2>
            <p>
              We use this information to authenticate users, provide construction planning and
              project-management services, prepare estimates and deliverables, process service
              orders, communicate project activity, protect the platform, and comply with law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Service providers</h2>
            <p>
              Kealee uses vetted infrastructure, authentication, payment, email, analytics, and
              AI service providers to operate the platform. Providers receive only the information
              needed for their function and are subject to contractual and security controls.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Retention and security</h2>
            <p>
              Information is retained for the project lifecycle, contractual and accounting
              requirements, dispute resolution, and applicable legal periods. Kealee uses access
              controls, encryption in transit, audit logging, and operational monitoring.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Your choices</h2>
            <p>
              You may disable location access in Android settings and request access, correction,
              export, or deletion of eligible personal information by contacting
              privacy@kealee.com. Some records must be retained for contractual or legal reasons.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-950">Contact</h2>
            <p>Kealee Services LLC · privacy@kealee.com · Maryland, United States</p>
          </section>
        </div>
      </article>
    </main>
  )
}
