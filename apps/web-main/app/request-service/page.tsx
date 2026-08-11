import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { ServiceRequestForm } from './service-request-form'
import { EditorialVideoHero } from '@/components/marketing/EditorialVideoHero'
import { ServiceExamplesGallery } from '@/components/marketing/ServiceExamplesGallery'

export const metadata: Metadata = {
  title: 'Request a Service — Kealee',
  description: 'Tell Kealee about your property and project. We will review the scope before recommending a service, price, and production path.',
}

const SERVICE_HEROES: Record<string, { videoSrc: string; poster: string }> = {
  preliminary_site_plan: {
    videoSrc: '/media/service-heroes/preliminary-site-plan.mp4',
    poster: '/media/service-heroes/preliminary-site-plan.jpg',
  },
  permit_site_plan: {
    videoSrc: '/media/service-heroes/preliminary-site-plan.mp4',
    poster: '/media/service-heroes/preliminary-site-plan.jpg',
  },
  'exterior-concept': {
    videoSrc: '/media/service-heroes/exterior-concept-request.mp4',
    poster: '/media/service-heroes/exterior-concept-request.jpg',
  },
  'interior-renovation': {
    videoSrc: '/media/service-heroes/interior-renovation-request.mp4',
    poster: '/media/service-heroes/interior-renovation-request.jpg',
  },
  'whole-home': {
    videoSrc: '/media/service-heroes/whole-home-request.mp4',
    poster: '/media/service-heroes/whole-home-request.jpg',
  },
  'garden-concept': {
    videoSrc: '/media/service-heroes/garden-concept-request.mp4',
    poster: '/media/service-heroes/garden-concept-request.jpg',
  },
  'developer-feasibility': {
    videoSrc: '/media/service-heroes/developer-feasibility-request.mp4',
    poster: '/media/service-heroes/developer-feasibility-request.jpg',
  },
  'permit-coordination': {
    videoSrc: '/media/service-heroes/permit-coordination.mp4',
    poster: '/media/service-photos/home-permits.jpg',
  },
  'project-planning': {
    videoSrc: '/media/service-heroes/project-planning-request.mp4',
    poster: '/media/service-heroes/project-planning-request.jpg',
  },
  'homeowner-concept': {
    videoSrc: '/media/service-heroes/project-planning-request.mp4',
    poster: '/media/service-heroes/project-planning-request.jpg',
  },
  'design-concept': {
    videoSrc: '/media/service-heroes/project-planning-request.mp4',
    poster: '/media/service-heroes/project-planning-request.jpg',
  },
  'next-phase': {
    videoSrc: '/media/service-heroes/project-planning-request.mp4',
    poster: '/media/service-heroes/project-planning-request.jpg',
  },
}

const SERVICE_NAMES: Record<string, string> = {
  'home-project-readiness-review': 'Project Clarity Review',
  preliminary_site_plan: 'Preliminary Site Plan',
  permit_site_plan: 'Permit Site Plan',
}

export default function RequestServicePage({ searchParams }: { searchParams?: { service?: string; name?: string } }) {
  const serviceKey = searchParams?.service ?? 'project-planning'
  const serviceName = SERVICE_NAMES[serviceKey] ?? searchParams?.name ?? serviceKey.replace(/[_-]/g, ' ')
  const hero = SERVICE_HEROES[serviceKey] ?? SERVICE_HEROES['project-planning']
  const isProjectClarity = serviceKey === 'home-project-readiness-review'
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <EditorialVideoHero eyebrow={isProjectClarity ? 'Free project entry service' : 'Personal project review'} title={isProjectClarity ? 'Get clarity, then choose what to build next.' : 'Let’s confirm the right path before you pay.'} description={isProjectClarity ? 'Kealee reviews your project goal, property context, and available documents for free, then recommends the paid design, site-plan, estimate, permit, or professional service that moves the project forward.' : 'Kealee reviews your desired outcome, property context, available sources, and likely professional involvement before recommending scope, price, and production timing.'} videoSrc={hero.videoSrc} poster={hero.poster} />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[#66758a] hover:text-[#10233e]"><ArrowLeft className="h-4 w-4" /> All services</Link>
        <div className="mt-8 grid overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(16,35,62,.1)] lg:grid-cols-[.8fr_1.2fr]">
          <aside className="relative overflow-hidden bg-[#e8e1d5] p-8 text-[#263831] sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,109,66,.18),transparent_55%)]" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#b85831]">{isProjectClarity ? 'Free Project Clarity Review' : 'Service review'}</p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{isProjectClarity ? 'Start free. Pay only for the service you choose next.' : 'Let’s confirm the right path before you pay.'}</h1>
              <p className="mt-5 text-sm leading-7 text-[#64716c]">No payment is taken with this request. Kealee uses your brief to recommend the next paid platform service and a clear production path.</p>
              <div className="mt-9 space-y-4">
                {['One short request instead of a long intake','Scope and price confirmed by Kealee','Private intake link after qualification','Every approved product delivered in your portal'].map(item => <p key={item} className="flex gap-3 text-sm font-bold"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4b8b72]" />{item}</p>)}
              </div>
              <div className="mt-10 rounded-2xl border border-[#bdb5a8] bg-white/55 p-5"><ShieldCheck className="h-5 w-5 text-[#4b8b72]" /><p className="mt-3 text-xs leading-6 text-[#64716c]">Preliminary planning does not replace surveys, professional drawings, agency determinations, contractor quotes, or required licensed review.</p></div>
            </div>
          </aside>
          <section className="p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#147d92]">Requested service</p>
            <h2 className="mt-2 text-3xl font-black capitalize text-[#10233e]">{serviceName}</h2>
            <p className="mt-3 text-sm leading-6 text-[#66758a]">Share enough for an initial suitability review. You can provide detailed measurements and documents after Kealee confirms the production path.</p>
            <ServiceRequestForm serviceKey={serviceKey} serviceName={serviceName} showPaidNextSteps={isProjectClarity} />
          </section>
        </div>
      </div>
      <ServiceExamplesGallery serviceKey={serviceKey} />
    </main>
  )
}
