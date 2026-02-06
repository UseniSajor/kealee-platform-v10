import { redirect } from "next/navigation"

// Root page redirects to dashboard (main landing view)
// Authentication is handled by middleware
export default function HomePage() {
  redirect("/dashboard")
}
