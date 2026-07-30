import { redirect } from 'next/navigation'

// Retired: folded into /signin (single master sign-in page for owners, contractors,
// developers, and staff). Kept as a redirect so bookmarked/indexed links keep working.
export default function StaffLoginPageRedirect() {
  redirect('/signin')
}
