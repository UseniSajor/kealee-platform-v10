import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, FileDown, ShieldCheck, Sparkles } from 'lucide-react'
import { HOME_JOURNEY_SERVICES, type HomeJourneyService } from '@/components/home/home-services-data'

export function JourneyServicePage({ service }: { service: HomeJourneyService }) {
  const index = HOME_JOURNEY_SERVICES.findIndex(item => item.id === service.id)
  const previous = HOME_JOURNEY_SERVICES[index - 1]
  const next = HOME_JOURNEY_SERVICES[index + 1]

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-[#10233e]">
      <section className="relative overflow-hidden bg-[#0c1d32]">
        {service.videoSrc ? (
          <video autoPlay muted loop playsInline preload="metadata" poster={service.photoSrc} className="absolute inset-0 h-full w-full object-cover opacity-40" aria-hidden="true">
            <source src={service.videoSrc} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,23,40,.97)_0%,rgba(8,23,40,.84)_55%,rgba(8,23,40,.35)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <Link href="/#choose-service" className="inline-flex items-center gap-2 text-sm font-bold text-white/75 hover:text-white"><ArrowLeft className="h-4 w-4" /> All six services</Link>
          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#70d5cd]">{service.subtitle}</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-[-.04em] text-white sm:text-6xl">{service.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{service.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={service.ctaLink} className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-3.5 text-sm font-black text-white shadow-lg hover:bg-[#df581f]">
                {service.ctaText} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#what-you-get" className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/15">See exactly what you get</a>
            </div>
            <p className="mt-4 text-xs font-semibold text-white/65">{service.priceHint} · {service.deliveryHint}</p>
          </div>
        </div>
      </section>

      <section id="what-you-get" className="scroll-mt-20 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#c8521a]">The product</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">What arrives in your workspace</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{service.outcome}</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {service.includes.map(item => <li key={item} className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold leading-6"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#168275]" />{item}</li>)}
            </ul>
            <div className="mt-8 flex flex-wrap gap-5 border-t border-slate-100 pt-7 text-sm font-bold text-slate-600">
              <span className="flex items-center gap-2"><FileDown className="h-5 w-5 text-[#168275]" /> Portal + downloadable files</span>
              <span className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#168275]" /> Visible delivery status</span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#10233e] p-7 text-white sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2abfbf]/15"><Sparkles className="h-6 w-6 text-[#70d5cd]" /></div>
            <p className="mt-7 text-xs font-black uppercase tracking-[.18em] text-[#70d5cd]">Fast, assisted intake</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Start with what you know.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">Kealee uses your address, uploads, and prior project answers to reduce repetitive forms. For this service, the useful starting questions are:</p>
            <ol className="mt-7 space-y-4">
              {service.aiQuestions.map((question, questionIndex) => (
                <li key={question} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#10233e]">{questionIndex + 1}</span>
                  <span className="pt-1 text-sm font-bold text-white">{question}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="flex gap-3 text-xs leading-6 text-slate-300"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> Automation helps organize information and accelerate production. Licensed design, engineering, surveying, agency approval, and construction remain with the qualified professionals responsible for that work.</p>
            </div>
            <Link href={service.ctaLink} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#10233e] hover:bg-slate-100">{service.ctaText} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Where this fits</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {HOME_JOURNEY_SERVICES.map((item, itemIndex) => (
              <div key={item.id} className="flex items-center gap-3">
                <Link href={`/services/${item.slug}`} className={`flex min-h-16 flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-black transition ${item.id === service.id ? 'border-[#f36b2b] bg-orange-50 text-[#a84416]' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                  <span className="text-xs text-slate-400">0{itemIndex + 1}</span>{item.shortTitle}
                  {item.id === service.id ? <Check className="ml-auto h-4 w-4" /> : null}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between gap-4">
            {previous ? <Link href={`/services/${previous.slug}`} className="text-sm font-bold text-slate-600 hover:text-[#10233e]">← {previous.shortTitle}</Link> : <span />}
            {next ? <Link href={`/services/${next.slug}`} className="text-sm font-black text-[#c8521a]">Next: {next.shortTitle} →</Link> : <Link href={service.ctaLink} className="text-sm font-black text-[#c8521a]">Start protected project →</Link>}
          </div>
        </div>
      </section>
    </main>
  )
}
