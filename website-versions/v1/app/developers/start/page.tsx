import { redirect } from 'next/navigation'

// Redirect to contact with developer context
export default function DevelopersStartPage() {
  redirect('/contact?type=developer')
}
