import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface HeroAction {
  label: string
  href: string
}

interface EditorialVideoHeroProps {
  eyebrow: string
  title: string
  description: string
  videoSrc: string
  poster: string
  primary?: HeroAction
  secondary?: HeroAction
  children?: ReactNode
}

export function EditorialVideoHero({
  eyebrow,
  title,
  description,
  videoSrc,
  poster,
  primary,
  secondary,
  children,
}: EditorialVideoHeroProps) {
  return (
    <section className="relative overflow-hidden bg-black">
      <video
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50" />
      <div className="relative z-10 mx-auto flex min-h-[420px] max-w-5xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">{description}</p>
        {children}
        {(primary || secondary) && (
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {primary && (
              <Link
                href={primary.href}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-7 py-3.5 text-base font-bold text-white transition hover:bg-[#df581f]"
              >
                {primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3.5 text-base font-bold text-white/85 transition hover:border-white/50 hover:text-white"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
