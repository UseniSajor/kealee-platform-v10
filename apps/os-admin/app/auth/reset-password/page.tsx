import { redirect } from 'next/navigation'

export default function LegacyResetPassword() {
  redirect('/login?reset_password=1')
}
