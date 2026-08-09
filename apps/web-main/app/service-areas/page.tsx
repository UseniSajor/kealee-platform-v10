import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { SERVICE_AREAS } from '@/lib/content/service-areas'
import { KEALEE_HQ_DISPLAY } from '@/lib/site/contact'

export const metadata: Metadata = {
  title: 'Service Areas — DC, Maryland & Virginia | Kealee',
  description:
    'Kealee serves the DC metro from headquarters in Oxon Hill, MD — permits, design, estimates, and contractors across PG County, Montgomery, DC, and Northern Virginia.',
  alternates: { canonical: 'https://kealee.com/service-areas' },
}

export default function ServiceAreasIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold font-display text-[#1A2B4A] sm:text-4xl">Where we work</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Headquarters: <strong>{KEALEE_HQ_DISPLAY}</strong>. Platform services across the DMV.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ul className="space-y-4">
            {SERVICE_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/service-areas/${area.slug}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-5 transition-colors hover:border-[#2ABFBF]/40 hover:bg-[#F7FAFC]"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#E8793A]" />
                    <div>
                      <p className="font-semibold text-[#1A2B4A]">{area.name}</p>
                      <p className="text-sm text-gray-500">{area.region}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
