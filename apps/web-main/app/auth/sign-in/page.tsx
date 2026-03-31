'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Supabase client (browser)
function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return createClient(url, anon)
}

export default function SignInPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const ownerPortal      = process.env.NEXT_PUBLIC_OWNER_PORTAL_URL      ?? '/auth/sign-in'
  const contractorPortal = process.env.NEXT_PUBLIC_CONTRACTOR_PORTAL_URL ?? '/auth/sign-in'
  const developerPortal  = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL  ?? '/auth/sign-in'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) {
        setError(authErr.message)
        return
      }
      // Default redirect to owner portal; role-based routing can be added later
      window.location.href = ownerPortal
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    try {
      const supabase = getSupabase()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: ownerPortal },
      })
    } catch {
      setError('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center py-16 px-4" style={{ background: 'var(--surface, #F5F4F0)' }}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,.08)', border: '1px solid var(--border, #E2E1DC)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: '#C8521A' }}
          >
            <span className="text-lg font-bold text-white font-display">K</span>
          </div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A1C1B' }}>Sign in to Kealee</h1>
          <p className="mt-2 text-sm text-gray-500">Access your owner, contractor, or developer account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-8 pb-8">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--border, #E2E1DC)', color: '#1A1C1B' }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border, #E2E1DC)' }} />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              <span className="bg-white px-2">or continue with email</span>
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#C8521A]"
              style={{ borderColor: 'var(--border, #E2E1DC)' }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:border-[#C8521A]"
              style={{ borderColor: 'var(--border, #E2E1DC)' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#C8521A' }}
          >
            {loading ? 'Signing in…' : <>Sign In <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        {/* Footer links */}
        <div
          className="border-t px-8 py-6 text-center text-xs text-gray-400 space-y-2"
          style={{ borderColor: 'var(--border, #E2E1DC)' }}
        >
          <p>
            <a href={contractorPortal} className="underline hover:text-gray-600">Are you a contractor?</a>
            {' · '}
            <a href={developerPortal} className="underline hover:text-gray-600">Are you a developer?</a>
          </p>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/concept" className="font-semibold underline" style={{ color: '#C8521A' }}>Start a project</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
