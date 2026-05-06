'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Layers } from 'lucide-react'
import { useRoleSelector } from '@/hooks/useRoleSelector'
import { RoleSelectorModal } from '@/components/modals/RoleSelectorModal'
import { Container } from '@/components/ui/Container'
import { AskChatBar } from '@/components/ui/AskChatBar'

export function HeroSection() {
  const { isOpen, context, open, close } = useRoleSelector()

  return (
    <>
      <section className="relative overflow-hidden py-20 lg:py-28" style={{ backgroundColor: '#1A2B4A' }}>
        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Teal glow */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#2ABFBF' }}
        />

        <Container width="md">
          <div className="relative text-center">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}>
              <Layers className="h-4 w-4" />
              Full Lifecycle Construction Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[58px] font-display">
              From Land to Closeout —{' '}
              <span style={{ color: '#E8793A' }}>One Intelligent Platform</span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 lg:text-xl">
              7 operating systems. 13 AI assistants. Escrow-protected payments.
              Project dashboards for every project — from kitchen remodels to multifamily developments.
            </p>

            {/* AskAnythingBar */}
            <div className="mt-8">
              <AskChatBar context="homepage" variant="dark" />
            </div>

            {/* CTA row */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => open('start-project')}
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ backgroundColor: '#E8793A' }}
              >
                Start a Project <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => open('join-marketplace')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/5"
              >
                Join the Marketplace
              </button>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
              {['Licensed & Insured', 'Escrow Protected', 'AI-Powered', 'DC-Baltimore Corridor'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" style={{ color: '#2ABFBF' }} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <RoleSelectorModal isOpen={isOpen} onClose={close} context={context} />
    </>
  )
}
