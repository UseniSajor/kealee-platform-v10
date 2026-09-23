import { redirect } from 'next/navigation'

/** Legacy concept URLs now open the canonical owner deliverable experience. */
export default async function LegacyConceptPage({ params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId } = await params
  redirect(`/concept/deliverable?intakeId=${encodeURIComponent(conceptId)}`)
}
