"use client"

import { ErrorBoundary } from "@kealee/ui"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <Toaster position="top-right" />
    </ErrorBoundary>
  )
}
