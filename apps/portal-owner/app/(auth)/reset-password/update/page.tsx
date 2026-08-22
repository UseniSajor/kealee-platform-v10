import { redirect } from 'next/navigation'

export default function LegacyPasswordReset() {
  redirect('/login?reset_password=1')
}
