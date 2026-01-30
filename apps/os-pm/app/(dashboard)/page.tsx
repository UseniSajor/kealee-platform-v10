import { Suspense } from "react"
import { DashboardClient } from "./dashboard-client"

export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-neutral-600">Loading dashboard...</div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardClient />
    </Suspense>
  )
}
