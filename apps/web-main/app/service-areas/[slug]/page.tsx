import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Clock, Building2, ArrowRight, Phone } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  SERVICE_AREA_SLUGS,
  getServiceArea,
  serviceAreaJsonLd,
} from '@/lib/content/service-areas'
import { KEALEE_PHONE_DISPLAY, KEALEE_PHONE_E164 } from '@/lib/site/contact'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return SERVICE_AREA_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const area = getServiceArea(slug)
  if (!area) return { title: 'Area not found' }
  const url = `https://kealee.com/service-areas/${slug}`
  return {
    title: `${area.headline} | Kealee`,
    description: area.description,
    keywords: area.keywords,
    openGraph: { title: area.headline, description: area.description, url },
    alternates: { canonical: url },
  }
}

export default async function ServiceAreaPage({ params }: Props) {
  const { slug } = await params
  const area = getServiceArea(slug)
  if (!area) notFound()

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={serviceAreaJsonLd(area)} />
      <section className="border-b border-gray-100 py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#2ABFBF]">{area.region}</span>
          <h1 className="mt-3 text-3xl font-bold font-display text-[#1A2B4A] sm:text-4xl">{area.headline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{area.description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={area.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: '#E8793A' }}
            >
              {area.primaryCta.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`tel:${KEALEE_PHONE_E164}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-[#1A2B4A]"
            >
              <Phone className="h-4 w-4" /> {KEALEE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-6">
              <Building2 className="h-6 w-6 text-[#2ABFBF]" />
              <h2 className="mt-3 font-bold text-[#1A2B4A]">Permit authority</h2>
              <p className="mt-2 text-sm text-gray-600">{area.permitAgency}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" /> Typical timeline: {area.typicalTimeline}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <MapPin className="h-6 w-6 text-[#E8793A]" />
              <h2 className="mt-3 font-bold text-[#1A2B4A]">Why Kealee here</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {area.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="text-[#38A169]">✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/concept" className="text-sm font-medium text-[#2ABFBF] hover:underline">
              AI concepts
            </Link>
            <Link href="/permits" className="text-sm font-medium text-[#2ABFBF] hover:underline">
              Permits
            </Link>
            <Link href="/estimate" className="text-sm font-medium text-[#2ABFBF] hover:underline">
              Estimates
            </Link>
            <Link href="/marketplace" className="text-sm font-medium text-[#2ABFBF] hover:underline">
              Contractors
            </Link>
            <Link href="/service-areas" className="text-sm font-medium text-[#2ABFBF] hover:underline">
              All service areas
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
