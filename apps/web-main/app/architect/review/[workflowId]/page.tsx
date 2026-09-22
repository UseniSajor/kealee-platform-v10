import { ReviewDetail } from '@/components/professional-review/ReviewDetail'

export const dynamic = 'force-dynamic'

/** OS Architecture — one assigned architectural review of a site plan's dwelling. */
export default async function ArchitectReviewPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params
  return <ReviewDetail workflowId={workflowId} discipline="architect" />
}
