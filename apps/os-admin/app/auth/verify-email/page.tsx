import { redirect } from 'next/navigation'

export default function LegacyVerifyEmail() {
  redirect('/login?verify_email=1')
}
