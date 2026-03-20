'use client'

import { useParams, useRouter } from 'next/navigation'
import { DynamicIntakeForm } from '@kealee/ui/components/intake/dynamic-intake-form'
import { isValidProjectPath, CAPTURE_REQUIRED_PROJECT_PATHS } from '@kealee/intake'
import { notFound } from 'next/navigation'

// Paths that route to capture gate immediately after intake (before review)
const CAPTURE_FIRST_PATHS = new Set([
  'capture_site_concept',
  'kitchen_remodel',
  'bathroom_remodel',
  'whole_home_remodel',
  'addition_expansion',
])

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
    // Paths that require capture go to capture gate before review
    if (CAPTURE_FIRST_PATHS.has(projectPath) || CAPTURE_REQUIRED_PROJECT_PATHS.has(projectPath)) {
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
