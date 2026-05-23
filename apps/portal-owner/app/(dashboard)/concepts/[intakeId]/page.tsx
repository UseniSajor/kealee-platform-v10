import { redirect } from 'next/navigation'

/**
 * Legacy route — full concept package lives on deliverables detail (single UX).
 */
export default async function ConceptIntakeRedirectPage({
  params,
}: {
  params: Promise<{ intakeId: string }>
}) {
  const { intakeId } = await params
  redirect(`/deliverables/${intakeId}`)
}
