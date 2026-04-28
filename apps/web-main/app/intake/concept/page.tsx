import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Play } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Get a Concept — Kealee',
  description:
    'Choose your concept type: exterior improvements, interior renovation, garden design, whole home, or new construction. AI-generated concepts delivered in days.',
}

// ── Category definitions ───────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'exterior',
    label: 'Exterior Improvements',
    tagline: 'Transform your home from the outside in',
    description:
      'Refresh your facade, expand your footprint, or document your property for planning. Get AI-generated exterior concepts, material palettes, and landscape overviews.',
    accentColor: 'orange' as const,
    heroImage: {
      src: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80&auto=format&fit=crop',
      alt: 'Modern home exterior concept',
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=75&auto=format&fit=crop', alt: 'Exterior elevation' },
      { src: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=75&auto=format&fit=crop', alt: 'Home addition render' },
      { src: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=500&q=75&auto=format&fit=crop', alt: 'Material palette' },
    ],
    includes: ['3 exterior renderings (front, side, rear)', 'Material & finish palette', 'Landscape overview sketch', 'MEP exterior spec', 'Detailed cost estimate', '30-min consultation'],
    services: [
      { path: 'exterior_concept', label: 'Exterior Concept', price: '$395', delivery: '3–5 days' },
      { path: 'addition_expansion', label: 'Addition / Expansion', price: '$495', delivery: '3–5 days' },
      { path: 'capture_site_concept', label: 'Site Capture Concept', price: '$125', delivery: '1–2 days' },
    ],
  },
  {
    id: 'interior',
    label: 'Interior Renovation',
    tagline: 'Reimagine every space inside your home',
    description:
      'From kitchen and bath upgrades to full interior overhauls — get detailed AI-generated concepts with line-item cost estimates, MEP specifications, and permit scope briefs.',
    accentColor: 'teal' as const,
    heroImage: {
      src: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
      alt: 'Modern kitchen renovation concept',
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500&q=75&auto=format&fit=crop', alt: 'Luxury bathroom concept' },
      { src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=75&auto=format&fit=crop', alt: 'Open plan living concept' },
      { src: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=500&q=75&auto=format&fit=crop', alt: 'Modern living room design' },
    ],
    includes: ['3 concept visuals (before/after)', 'Bill of Materials with line-item costs', 'MEP specification', 'Detailed cost estimate', 'Zoning & permit scope brief', '30-min consultation'],
    services: [
      { path: 'kitchen_remodel', label: 'Kitchen Remodel', price: '$395', delivery: '3–5 days' },
      { path: 'bathroom_remodel', label: 'Bathroom Remodel', price: '$295', delivery: '2–4 days' },
      { path: 'interior_reno_concept', label: 'Interior Reno Concept', price: '$345', delivery: '3–5 days' },
      { path: 'interior_renovation', label: 'Interior Renovation', price: '$345', delivery: '3–5 days' },
      { path: 'whole_home_remodel', label: 'Whole-Home Remodel', price: '$695', delivery: '4–6 days' },
    ],
  },
  {
    id: 'garden',
    label: 'Garden & Landscape',
    tagline: 'Design your outdoor living space',
    description:
      'Create a landscape plan, garden layout, and outdoor living design with AI-generated concepts tailored to your property, soil type, and climate zone.',
    accentColor: 'green' as const,
    heroImage: {
      src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80&auto=format&fit=crop',
      alt: 'Garden landscape concept',
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=75&auto=format&fit=crop', alt: 'Garden bed design' },
      { src: 'https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=500&q=75&auto=format&fit=crop', alt: 'Outdoor patio concept' },
      { src: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=500&q=75&auto=format&fit=crop', alt: 'Landscape planting plan' },
    ],
    includes: ['Landscape layout plan', 'Plant species guide', 'Irrigation overview', 'Hardscape design concept', 'Seasonal planting schedule', '30-min consultation'],
    services: [
      { path: 'garden_concept', label: 'Garden Concept', price: '$295', delivery: '2–4 days' },
    ],
  },
  {
    id: 'whole-home',
    label: 'Whole Home',
    tagline: 'Every room, reimagined together',
    description:
      'A complete home transformation concept covering interior, exterior, and landscape — fully coordinated with a unified design direction and master cost plan.',
    accentColor: 'blue' as const,
    heroImage: {
      src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=80&auto=format&fit=crop',
      alt: 'Whole home concept render',
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&q=75&auto=format&fit=crop', alt: 'Open plan kitchen-living concept' },
      { src: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=500&q=75&auto=format&fit=crop', alt: 'Master bedroom concept' },
      { src: 'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=500&q=75&auto=format&fit=crop', alt: 'Full exterior view' },
    ],
    includes: ['Full interior concept (all rooms)', 'Exterior elevation concept', 'Room-by-room renders', 'Master cost estimate', 'MEP scope across all systems', '30-min consultation'],
    services: [
      { path: 'whole_home_concept', label: 'Whole Home Concept', price: '$595', delivery: '4–6 days' },
    ],
  },
  {
    id: 'new-construction',
    label: 'New Construction',
    tagline: 'Build something new — built right',
    description:
      'From single-lot custom homes to multi-unit developments — AI-generated architectural concepts, site plans, feasibility analysis, and build-ready direction.',
    accentColor: 'navy' as const,
    heroImage: {
      src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80&auto=format&fit=crop',
      alt: 'New construction architectural concept',
    },
    gallery: [
      { src: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&q=75&auto=format&fit=crop', alt: 'Architectural elevation render' },
      { src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&q=75&auto=format&fit=crop', alt: 'Site plan overview' },
      { src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=75&auto=format&fit=crop', alt: 'Foundation and framing plan' },
    ],
    includes: ['Architectural concept renders', 'Site plan overview', 'Feasibility analysis', 'Cost estimate', 'Permit scope brief', '30-min consultation'],
    services: [
      { path: 'design_build', label: 'Design + Build Package', price: '$795', delivery: '5–7 days' },
      { path: 'developer_concept', label: 'Developer Concept', price: '$795', delivery: '5–7 days' },
      { path: 'single_lot_development', label: 'Single-Lot Development', price: '$899', delivery: '4–6 days' },
    ],
  },
]

// ── Accent colour utilities ────────────────────────────────────────────────────

type AccentColor = 'orange' | 'teal' | 'green' | 'blue' | 'navy'

const ACCENT = {
  orange: {
    badge: 'bg-orange-100 text-orange-700',
    chip: 'bg-orange-600 hover:bg-orange-700 text-white',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
    pill: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  teal: {
    badge: 'bg-teal-100 text-teal-700',
    chip: 'bg-teal-600 hover:bg-teal-700 text-white',
    dot: 'bg-teal-500',
    border: 'border-teal-200',
    pill: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  green: {
    badge: 'bg-emerald-100 text-emerald-700',
    chip: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    chip: 'bg-blue-600 hover:bg-blue-700 text-white',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
    pill: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  navy: {
    badge: 'bg-slate-100 text-slate-700',
    chip: 'bg-[#1A2B4A] hover:bg-[#14203a] text-white',
    dot: 'bg-[#1A2B4A]',
    border: 'border-slate-300',
    pill: 'bg-slate-50 text-slate-700 border-slate-200',
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryNav() {
  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="flex-shrink-0 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-700 transition whitespace-nowrap"
            >
              {cat.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function VideoPlaceholder({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 group">
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover opacity-80 group-hover:opacity-70 transition duration-500"
        sizes="(max-width: 768px) 100vw, 55vw"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 group-hover:scale-110 transition duration-300">
          <Play className="w-6 h-6 text-white fill-white ml-1" />
        </div>
      </div>
      {/* Bottom label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <span className="text-xs text-white/70 font-medium">Sample concept output</span>
      </div>
    </div>
  )
}

function GalleryRow({ images }: { images: { src: string; alt: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((img, i) => (
        <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover hover:scale-105 transition duration-500"
            sizes="(max-width: 768px) 33vw, 18vw"
          />
        </div>
      ))}
    </div>
  )
}

function ServiceChip({
  service,
  color,
}: {
  service: { path: string; label: string; price: string; delivery: string }
  color: AccentColor
}) {
  const accent = ACCENT[color]
  return (
    <Link href={`/intake/${service.path}`}>
      <div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:shadow-sm transition cursor-pointer">
        <div>
          <p className="text-sm font-semibold text-slate-900">{service.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {service.delivery}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-black text-slate-900">{service.price}</span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </Link>
  )
}

function CategorySection({ cat, reversed }: { cat: typeof CATEGORIES[0]; reversed: boolean }) {
  const accent = ACCENT[cat.accentColor]
  return (
    <section id={cat.id} className="py-20 border-b border-slate-100 scroll-mt-32">
      <div className="mx-auto max-w-6xl px-4">

        {/* Category label */}
        <div className="mb-8">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${accent.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
            {cat.label}
          </span>
        </div>

        {/* Main grid — alternating left/right */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start ${reversed ? 'lg:grid-flow-dense' : ''}`}>

          {/* Visual column */}
          <div className={`space-y-4 ${reversed ? 'lg:col-start-2' : ''}`}>
            <VideoPlaceholder image={cat.heroImage.src} alt={cat.heroImage.alt} />
            <GalleryRow images={cat.gallery} />
          </div>

          {/* Content column */}
          <div className={`space-y-6 ${reversed ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{cat.tagline}</h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{cat.description}</p>
            </div>

            {/* Includes */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Every package includes</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {cat.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Service options */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Choose a package</p>
              <div className="space-y-2.5">
                {cat.services.map((svc) => (
                  <ServiceChip key={svc.path} service={svc} color={cat.accentColor} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConceptLandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-[#1A2B4A] px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">AI-Powered Design Concepts</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            What kind of concept<br className="hidden sm:block" /> do you need?
          </h1>
          <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
            Choose a category below. Each package delivers AI-generated renders, cost estimates, and MEP specs — in days, not months.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky category nav */}
      <CategoryNav />

      {/* Category sections — alternate layout */}
      {CATEGORIES.map((cat, i) => (
        <CategorySection key={cat.id} cat={cat} reversed={i % 2 === 1} />
      ))}

      {/* Footer CTA */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Not sure which package fits?</h2>
          <p className="text-slate-600 mb-8">Browse all services or start with our most popular — the Exterior Concept package.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/gallery"
              className="rounded-xl border-2 border-slate-200 px-8 py-3.5 text-sm font-bold text-slate-700 hover:bg-white hover:border-slate-300 transition"
            >
              Browse All Services
            </Link>
            <Link
              href="/intake/exterior_concept"
              className="rounded-xl bg-orange-600 hover:bg-orange-700 px-8 py-3.5 text-sm font-bold text-white transition flex items-center justify-center gap-2"
            >
              Start with Exterior Concept <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
