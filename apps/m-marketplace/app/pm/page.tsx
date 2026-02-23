import { redirect } from "next/navigation"

// Root page redirects to the dashboard
// Internal PMs and external GCs both land here
// The dashboard page itself handles role-based content
export default function HomePage() {
  redirect("/pm/projects")
}
