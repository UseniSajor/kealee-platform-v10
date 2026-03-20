'use client'

import { useParams, useRouter } from 'next/navigation'
import { DynamicIntakeForm } from '@kealee/ui/components/intake/dynamic-intake-form'
import { isValidProjectPath } from '@kealee/intake'
import { notFound } from 'next/navigation'

export default function IntakeFormPage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = params.projectPath as string

  if (!isValidProjectPath(projectPath)) {
    notFound()
  }

  function handleComplete(data: Record<string, unknown>) {
    // Persist full form data to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`kealee_intake_${projectPath}`, JSON.stringify(data))
    }
    // capture_site_concept goes directly to capture gate (no payment required)
    if (projectPath === 'capture_site_concept') {
      router.push(`/intake/${projectPath}/capture`)
    } else {
      router.push(`/intake/${projectPath}/review`)
    }
  }

  return (
    <DynamicIntakeForm
      projectPath={projectPath}
      onComplete={handleComplete}
    />
  )
}
