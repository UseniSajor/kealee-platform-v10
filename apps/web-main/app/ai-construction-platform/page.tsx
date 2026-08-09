import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileSearch, MapPinned, ShieldCheck, Sparkles } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  aiSearchFaqs,
  audiencePaths,
  comparisonRows,
  phase4Hero,
  purchasePaths,
  serviceArchitecture,
} from '@/lib/content/phase4-growth'
import { KEALEE_SERVICE_AREAS, KEALEE_SITE_URL } from '@/lib/site/contact'

const phase4Description =
  'Kealee is an AI construction platform for DC, Maryland, and Virginia. Plan projects, compare costs, prepare permits, match contractors, and move into a guided project workspace.'

export const metadata: Metadata = {
  title: 'AI Construction Platform for Design, Permits, Estimates and Build',
  description: phase4Description,
  alternates: { canonical: '/ai-construction-platform' },
  keywords: [
    'AI construction platform',
    'design build platform',
    'construction project planning software',
    'DC permit and estimate platform',
    'Maryland renovation estimate',
    'Virginia contractor marketplace',
    'AI construction estimate',
  ],
  openGraph: {
    title: 'Kealee AI Construction Platform',
    description:
      'Plan, price, permit, and build construction projects from one guided workspace for DC, Maryland, and Virginia.',
    url: `${KEALEE_SITE_URL}/ai-construction-platform`,
    type: 'website',
  },
}

const trustProof = [
  {
    title: 'Local context',
    body: 'DC, Maryland, and Virginia workflows need jurisdiction-aware planning.',
    Icon: MapPinned,
  },
  {
    title: 'Decision support',
    body: 'Concept, cost, permit, and bid context live together.',
    Icon: CheckCircle2,
  },
  {
    title: 'Professional handoff',
    body: 'Use Kealee before engaging licensed professionals or contractors.',
    Icon: ShieldCheck,
  },
]

function buildPhase4JsonLd() {
  const pageUrl = `${KEALEE_SITE_URL}/ai-construction-platform`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: 'AI Construction Platform for Design, Permits, Estimates and Build',
      description: phase4Description,
      isPartOf: { '@id': `${KEALEE_SITE_URL}/#website` },
      about: [
        'AI construction platform',
        'construction cost estimation',
        'permit planning',
        'contractor marketplace',
        'design-build project workspace',
      ],
      areaServed: KEALEE_SERVICE_AREAS.map((name) => ({ '@type': 'AdministrativeArea', name })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Kealee',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: KEALEE_SITE_URL,
      description: phase4Hero.directAnswer,
      offers: {
        '@type': 'OfferCatalog',
        name: 'Kealee project paths',
        itemListElement: serviceArchitecture.map((service) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service.schemaName,
            url: `${KEALEE_SITE_URL}${service.href}`,
            areaServed: KEALEE_SERVICE_AREAS,
          },
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: aiSearchFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: KEALEE_SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'AI Construction Platform',
          item: pageUrl,
        },
      ],
    },
  ]
}

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">{title}</h2>
      <div className="mt-4 text-base leading-7 text-gray-600">{children}</div>
    </div>
  )
}

function TrackedLink({
  href,
  event,
  children,
  primary = false,
}: {
  href: string
  event: string
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      data-conversion-event={event}
      className={
        primary
          ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700'
          : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-blue-300 hover:text-blue-700'
      }
    >
      {children}
    </Link>
  )
}

export default function AiConstructionPlatformPage() {
  return (
    <div className="bg-white text-gray-950">
      <JsonLd data={buildPhase4JsonLd()} />

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{phase4Hero.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-gray-950 sm:text-5xl lg:text-6xl">
              {phase4Hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">{phase4Hero.summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink href="/get-concept" event="phase4_primary_cta_click" primary>
                Start with a concept package <ArrowRight className="h-4 w-4" />
              </TrackedLink>
              <TrackedLink href="/pricing" event="phase4_pricing_cta_click">
                Compare pricing
              </TrackedLink>
            </div>
          </div>

          <aside className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Direct answer</p>
            </div>
            <p className="mt-5 text-lg leading-8 text-gray-800">{phase4Hero.directAnswer}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-gray-50 p-3">
                <dt className="font-semibold text-gray-950">Best for</dt>
                <dd className="mt-1 text-gray-600">Preconstruction decisions</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <dt className="font-semibold text-gray-950">Serves</dt>
                <dd className="mt-1 text-gray-600">DC, MD, VA</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <dt className="font-semibold text-gray-950">Next step</dt>
                <dd className="mt-1 text-gray-600">Concept, estimate, permit, or call</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-3">
                <dt className="font-semibold text-gray-950">Output</dt>
                <dd className="mt-1 text-gray-600">Scoped project workspace</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="User ease" title="Choose the path that matches your project decision.">
            Kealee is organized around what you are trying to decide next: scope, cost, permits, contractor fit, or project control.
          </SectionHeader>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {audiencePaths.map((path) => (
              <article key={path.audience} className="rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-950">{path.audience}</h3>
                <p className="mt-4 text-sm font-semibold text-gray-700">{path.intent}</p>
                <p className="mt-3 text-sm leading-6 text-gray-600">{path.outcome}</p>
                <TrackedLink href={path.href} event="phase4_audience_path_click">
                  {path.cta} <ArrowRight className="h-4 w-4" />
                </TrackedLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="SEO and AI search" title="A crawlable service architecture with answer-ready content.">
            Each service path uses plain-language copy, internal links, and structured data so search engines and AI answer systems can understand the entity, service, location, and next action.
          </SectionHeader>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {serviceArchitecture.map((service) => (
              <article key={service.name} className="rounded-lg border border-gray-200 bg-white p-5">
                <FileSearch className="h-6 w-6 text-blue-700" />
                <h3 className="mt-4 text-lg font-semibold text-gray-950">{service.name}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{service.description}</p>
                <Link
                  href={service.href}
                  data-conversion-event="phase4_service_link_click"
                  className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  View path <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Conversion" title="Make it easier to buy the next useful step.">
            Phase 4 turns broad interest into specific actions: start a concept, compare estimates, check permits, or talk to a human.
          </SectionHeader>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {purchasePaths.map((path) => (
              <article key={path.title} className="flex flex-col rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">{path.label}</p>
                <h3 className="mt-3 text-xl font-semibold text-gray-950">{path.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{path.description}</p>
                <TrackedLink href={path.href} event="phase4_purchase_path_click" primary={path.label === 'Fastest start'}>
                  {path.cta}
                </TrackedLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Trust and comparison" title="Kealee fits before the expensive commitment.">
            The platform is designed to reduce ambiguity before you over-invest in drawings, bids, or construction commitments.
          </SectionHeader>
          <div className="mt-10 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid grid-cols-4 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Path</span>
              <span>Strength</span>
              <span>Risk</span>
              <span>How Kealee helps</span>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.path} className="grid grid-cols-1 gap-3 border-t border-gray-200 px-4 py-5 text-sm md:grid-cols-4">
                <strong className="text-gray-950">{row.path}</strong>
                <span className="text-gray-600">{row.strength}</span>
                <span className="text-gray-600">{row.limitation}</span>
                <span className="font-medium text-blue-800">{row.kealee}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {trustProof.map(({ title, body, Icon }) => (
              <div key={title} className="rounded-lg border border-gray-200 bg-white p-5">
                <Icon className="h-6 w-6 text-green-700" />
                <h3 className="mt-4 text-lg font-semibold text-gray-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="AI-search FAQ" title="Direct answers for buyers and answer engines.">
            These questions are written to be useful to people and clear to search systems.
          </SectionHeader>
          <div className="mt-10 space-y-4">
            {aiSearchFaqs.map((faq) => (
              <article key={faq.q} className="rounded-lg border border-gray-200 p-6" data-conversion-event="phase4_faq_read">
                <h3 className="text-lg font-semibold text-gray-950">{faq.q}</h3>
                <p className="mt-3 text-base leading-7 text-gray-600">{faq.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Start with the smallest useful next step.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
            If you are not sure whether to begin with concept, estimate, permit support, or a call, Kealee can route you from one intake into the right project path.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink href="/get-started" event="phase4_primary_cta_click" primary>
              Get started <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <TrackedLink href="/book-a-call" event="phase4_book_call_click">
              Book a call
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  )
}
