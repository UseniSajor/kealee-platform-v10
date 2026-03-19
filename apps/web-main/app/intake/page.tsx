'use client'

import { useRouter } from 'next/navigation'
import { IntakePathSelector } from '@kealee/ui/components/intake/intake-path-selector'
import type { ProjectPath } from '@kealee/intake'

export default function IntakeLandingPage() {
  const router = useRouter()

  function handleSelect(path: ProjectPath) {
    router.push(`/intake/${path}`)
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: '#E8793A' }}
        >
          Design Consultation
        </span>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ color: '#1A2B4A' }}>
          Start Your Project with Kealee
        </h1>
        <p className="mt-3 text-gray-500 max-w-lg mx-auto">
          Select the type of project you are planning so we can guide you through the right intake
          path inside the Kealee platform.
        </p>
      </div>

      <IntakePathSelector onSelect={handleSelect} />
    </div>
  )
}
