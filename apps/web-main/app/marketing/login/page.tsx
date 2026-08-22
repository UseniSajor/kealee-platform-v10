import { redirect } from 'next/navigation'

export default function LegacyMarketingLogin() {
  redirect('/sign-in?redirect_url=%2Fmarketing%2Fworkspace')
}
