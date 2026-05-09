import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'

interface RoleHeroProps {
  badge:         string
  badgeColor?:   string
  headline:      string
  highlight?:    string
  subhead?:      string
  subheadline?:  string
  cta?:          { label: string; href: string }
  primaryCTA?:   { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  secondaryCTA?: { label: string; href: string }
  trustItems?:   string[]
  dark?:         boolean
}

export function RoleHero({ badge, headline, highlight, subhead, subheadline, cta, primaryCTA, secondaryCta, secondaryCTA, trustItems, dark = true }: RoleHeroProps) {
  const resolvedCta = cta ?? primaryCTA
  const resolvedSecondaryCta = secondaryCta ?? secondaryCTA
  const resolvedSubhead = subhead ?? subheadline ?? ''
  const bg     = dark ? '#1A2B4A' : '#F7FAFC'
  const text   = dark ? 'text-white' : ''
  const subClr = dark ? 'text-gray-300' : 'text-gray-600'

  // Insert highlight coloring into headline
  const titleEl = highlight
    ? headline.replace(highlight, `<span style="color:#E8793A">${highlight}</span>`)
    : headline

  return (
    <section className="relative overflow-hidden py-20 lg:py-28" style={{ backgroundColor: bg }}>
      {/* subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFF' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
      />

      <Container width="md">
        <div className="relative text-center">
          <Badge variant="teal" className="mb-6">{badge}</Badge>

          <h1
            className={`font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-[52px] ${text}`}
            dangerouslySetInnerHTML={{ __html: titleEl }}
          />

          <p className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed ${subClr}`}>
            {resolvedSubhead}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                className="inline-flex items-center gap-2 rounded-xl border-2 px-7 py-3.5 text-sm font-semibold transition-all"
                style={{ borderColor: dark ? 'rgba(255,255,255,0.3)' : '#2ABFBF', color: dark ? 'white' : '#2ABFBF' }}
              >
                {resolvedSecondaryCta.label}
              </Link>
            )}
          </div>

          {trustItems && trustItems.length > 0 && (
            <div className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {trustItems.map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <span style={{ color: '#2ABFBF' }}>✓</span> {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
