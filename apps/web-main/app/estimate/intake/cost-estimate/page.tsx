import { redirect } from 'next/navigation'

/** Historical URL retained as a redirect; estimating now ships with the selected plan. */
export default function RetiredEstimateIntakePage() {
  redirect('/services')
}
