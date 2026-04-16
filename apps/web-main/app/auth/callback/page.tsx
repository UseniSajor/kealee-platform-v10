'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@kealee/core-auth'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check if session was created
        const session = await getSession()

        if (session) {
          // Redirect to onboarding or dashboard
          router.push('/onboarding')
        } else {
          // Redirect to login if callback failed
          router.push('/auth/login?error=callback_failed')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-900">Completing sign in...</h1>
        <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  )
}
