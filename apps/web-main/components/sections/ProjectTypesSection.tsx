import Link from 'next/link'

const PROJECT_TYPES = [
  { label: 'Kitchen',           type: 'kitchen',         img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80' },
  { label: 'Bathroom',          type: 'bathroom',         img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80' },
  { label: 'ADU',               type: 'adu',              img: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80' },
  { label: 'Addition',          type: 'addition',         img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80' },
  { label: 'Whole Home',        type: 'whole_home',       img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80' },
  { label: 'Exterior / Curb',   type: 'exterior_concept', img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80' },
  { label: 'Garden',            type: 'garden',           img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80' },
  { label: 'Commercial',        type: 'commercial',       img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80' },
  { label: 'New Construction',  type: 'new_construction', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
]

export function ProjectTypesSection() {
  return (
    <section className="py-20" style={{ background: 'var(--surface, #F5F4F0)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">All Project Types</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Every project, handled end-to-end
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-500">
            Select your project type and our AI will prepare a tailored concept, cost estimate, and permit checklist.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {PROJECT_TYPES.map(pt => (
            <Link
              key={pt.type}
              href={`/concept?type=${pt.type}`}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] block"
            >
              <img
                src={pt.img}
                alt={pt.label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-end p-4">
                <div className="flex w-full items-center justify-between">
                  <span className="text-base font-bold text-white font-display">{pt.label}</span>
                  <span
                    className="text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: '#C8521A' }}
                  >
                    Explore →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
