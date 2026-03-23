'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      window.location.href = '/projects'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border p-8 shadow-2xl" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#2ABFBF' }}>
          <Home className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Owner Portal</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Sign in to manage your project</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E', '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        New to Kealee?{' '}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>
          Create an account
        </Link>
      </p>
    </div>
  )
}
