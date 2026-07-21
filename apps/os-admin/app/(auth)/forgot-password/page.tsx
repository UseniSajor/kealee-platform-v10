import { Suspense } from "react"
import { ForgotPasswordClient } from "./forgot-password-client"

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-400">Loading...</div>}>
      <ForgotPasswordClient />
    </Suspense>
  )
}
