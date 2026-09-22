import { ReviewDetail } from '@/components/professional-review/ReviewDetail'

export const dynamic = 'force-dynamic'

export default async function EngineerReviewPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params
  return <ReviewDetail workflowId={workflowId} discipline="professional_engineer" />
}
