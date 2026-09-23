import { redirect } from 'next/navigation'

/** Estimating is included with plan products and is no longer sold separately. */
export default function RetiredEstimatePage() {
  redirect('/services')
}
