'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { IntakeSuccessPanel } from '@kealee/ui/components/intake/intake-success-panel'

export function IntakeSuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string
  const intakeId = searchParams.get('intakeId') ?? 'unknown'

  const allowUpload = projectPath === 'whole_home_remodel' || projectPath === 'design_build'

  return (
    <IntakeSuccessPanel
      intakeId={intakeId}
      projectPath={projectPath}
      allowUpload={allowUpload}
      portalUrl="/portal"
    />
  )
}
