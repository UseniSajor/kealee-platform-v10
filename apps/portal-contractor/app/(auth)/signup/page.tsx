'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HardHat, Mail, Lock, User, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('')
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
        options: { data: { full_name: name, company_name: companyName, role: 'contractor' } },
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
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(56,161,105,0.15)' }}>
          <Mail className="h-7 w-7" style={{ color: '#38A169' }} />
        </div>
        <h2 className="font-display text-xl font-bold" style={{ color: '#1A2B4A' }}>Check Your Email</h2>
        <p className="mt-2 text-sm text-gray-600">
          Confirmation link sent to <strong>{email}</strong>. Your application will be reviewed within 24 hours.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: '#2ABFBF' }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#E8793A' }}>
          <HardHat className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Join as Contractor</h1>
        <p className="mt-1 text-sm text-gray-600">Access leads and grow your business</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div>
          <label htmlFor="company" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
              onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              placeholder="ABC Construction" required />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
              onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              placeholder="John Smith" required />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
              onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              placeholder="your@company.com" required />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium" style={{ color: '#1A2B4A' }}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1"
              onFocus={(e) => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              placeholder="Min 8 characters" required minLength={8} />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#E8793A' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C65A20')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E8793A')}>
          {loading ? 'Creating account...' : 'Apply Now'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already registered?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>Sign in</Link>
      </p>
    </div>
  )
}
