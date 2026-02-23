import { Suspense } from "react"
import { LoginClient } from "./login-client"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">Loading…</div>}>
      <LoginClient />
    </Suspense>
  )
}

