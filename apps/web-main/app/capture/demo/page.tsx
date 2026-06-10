'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function CaptureDemoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDemo = async () => {
      try {
        const res = await fetch('/api/capture/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_path: 'kitchen_remodel',
            address: '123 Demo Street, Demo City, DC 20001',
            client_name: 'Demo User',
            capture_mode: 'standard',
          }),
        })

        if (!res.ok) {
          setError('Failed to create demo session. Please try again.')
          return
        }

        const { captureToken } = await res.json()
        router.push(`/capture/${captureToken}`)
      } catch (err) {
        setError('Error loading demo capture tool. Please try again.')
        console.error('Error creating demo session:', err)
      }
    }

    initDemo()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-orange-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Unable to load demo</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#E8793A' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
        <p className="mt-4 text-gray-600">Loading demo capture tool...</p>
      </div>
    </div>
  )
}
