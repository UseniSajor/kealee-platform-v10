import { ReviewQueue } from '@/components/professional-review/ReviewQueue'

export const dynamic = 'force-dynamic'

/** OS Engineering — the licensed engineer's site-plan review queue. */
export default async function EngineerReviewQueuePage() {
  return <ReviewQueue discipline="professional_engineer" />
}
