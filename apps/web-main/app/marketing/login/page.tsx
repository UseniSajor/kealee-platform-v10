'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, Loader2, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

const WORKSPACE_PATH = '/marketing/workspace'

function AgencyLoginForm() {
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      window.location.href = WORKSPACE_PATH
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A2B4A]">
            <Megaphone className="h-8 w-8 text-[#2ABFBF]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8793A]">
            Partner access
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1A2B4A] font-display">
            Marketing workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Sign in with the credentials Kealee provided for your agency account.
            Content, concept visuals, and lead summaries live here — not in the homeowner or contractor portals.
          </p>
        </div>

        {authError === 'unauthorized' && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This account does not have marketing workspace access. Contact your Kealee point of contact.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="agency-email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Work email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="agency-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-[#2ABFBF] focus:ring-2 focus:ring-[#2ABFBF]/20"
                placeholder="you@agency.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="agency-password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="agency-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none focus:border-[#2ABFBF] focus:ring-2 focus:ring-[#2ABFBF]/20"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8793A] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in to workspace
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MarketingAgencyLoginPage() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0F1D34 0%, #1A2B4A 45%, #0F1D34 100%)' }}
    >
      <header className="flex items-center justify-center gap-2 px-6 py-8">
        <Image
          src="/media/kealee-logo.svg"
          alt="Kealee"
          width={120}
          height={32}
          className="h-8 w-auto brightness-0 invert"
          priority
        />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#2ABFBF]" />
            </div>
          }
        >
          <AgencyLoginForm />
        </Suspense>
      </main>
    </div>
  )
}
