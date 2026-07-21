'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Radar, Mail, Lock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role: 'operator' } },
      })
      if (authError) throw authError
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border p-8 shadow-2xl text-center" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <h2 className="font-display text-xl font-bold text-white">Request Submitted</h2>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>An admin must approve your command center access. Check <strong className="text-white">{email}</strong> for updates.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#2ABFBF' }}>Back to sign in</Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border p-8 shadow-2xl" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#E8793A' }}>
          <Radar className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Request Access</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Command Center access requires approval</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        {error && <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#FCA5A5' }}>{error}</div>}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
              placeholder="Full Name" required />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
              placeholder="your@kealee.com" required />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
              placeholder="Min 8 characters" required minLength={8} />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8793A' }}>
          {loading ? 'Submitting...' : 'Request Access'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Already have access?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>Sign in</Link>
      </p>
    </div>
  )
}
