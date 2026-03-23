import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface RoleCTAProps {
  headline:      string
  subhead?:      string
  subheadline?:  string
  cta?:          { label: string; href: string }
  primaryCTA?:   { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  secondaryCTA?: { label: string; href: string }
  bg?:           string
  accentColor?:  string
}

export function RoleCTA({ headline, subhead, subheadline, cta, primaryCTA, secondaryCta, secondaryCTA, bg = '#1A2B4A' }: RoleCTAProps) {
  const resolvedCta = cta ?? primaryCTA
  const resolvedSecondaryCta = secondaryCta ?? secondaryCTA
  const resolvedSubhead = subhead ?? subheadline

  return (
    <section className="py-20" style={{ backgroundColor: bg }}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white font-display sm:text-4xl">{headline}</h2>
          {resolvedSubhead && <p className="mt-4 text-lg text-gray-300">{resolvedSubhead}</p>}

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {resolvedCta && (
              <Link
                href={resolvedCta.href}
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                {resolvedCta.label} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {resolvedSecondaryCta && (
              <Link
                href={resolvedSecondaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/60"
              >
                {resolvedSecondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
