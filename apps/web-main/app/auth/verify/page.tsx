'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyOtp } from '@kealee/core-auth'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!code || code.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    if (!email) {
      setError('Email address is required')
      return
    }

    setLoading(true)

    try {
      await verifyOtp(email, code)
      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/onboarding')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    // Call resend OTP endpoint
    setResendCooldown(60)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error('Failed to resend code')
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
      setResendCooldown(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-sm text-gray-600 mt-2">
            We sent a 6-digit code to<br />
            <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Redirecting to complete your profile...
              </p>
              <div className="animate-pulse flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Code Input */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Check your email for the code. It may take a few minutes.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition mt-6"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              {/* Resend */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium text-sm"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>

              {/* Change Email */}
              <div className="text-center pt-2">
                <Link
                  href="/auth/signup"
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Use a different email
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl text-center border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
