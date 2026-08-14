import Image from 'next/image'
import Link from 'next/link'
import { SERVICES } from '@/lib/services-config'

interface ServiceExamplesGalleryProps {
  /** Service slug, intakePath, or category to filter by. Falls back to a general spread if nothing matches. */
  serviceKey: string
  limit?: number
}

export function ServiceExamplesGallery({ serviceKey, limit = 6 }: ServiceExamplesGalleryProps) {
  const matched = SERVICES.filter(
    service => service.slug === serviceKey || service.intakePath === serviceKey || service.category === serviceKey,
  )
  const examples = (matched.length > 0 ? matched : SERVICES).slice(0, limit)

  if (examples.length === 0) return null

  return (
    <section className="border-t border-gray-100 bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-[#10233e]">Project examples</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Real Kealee project deliverables across design, permitting, and construction.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map(service => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                <Image
                  src={service.heroImage}
                  alt={service.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#E8724B]">{service.category}</p>
                <h3 className="mt-1 text-lg font-bold text-[#10233e]">{service.label}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{service.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
