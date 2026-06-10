'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CaptureDemoPage() {
  const router = useRouter()

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
          console.error('Failed to create demo session')
          return
        }

        const { captureToken } = await res.json()
        router.push(`/capture/${captureToken}`)
      } catch (err) {
        console.error('Error creating demo session:', err)
      }
    }

    initDemo()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
        <p className="mt-4 text-gray-600">Loading demo capture tool...</p>
      </div>
    </div>
  )
}
