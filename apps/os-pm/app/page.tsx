import { redirect } from "next/navigation"

// Root page redirects to work-queue (main dashboard view)
// Authentication is handled by middleware
export default function HomePage() {
  redirect("/work-queue")
}
