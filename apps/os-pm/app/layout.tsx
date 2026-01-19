import type { Metadata } from 'next'
import { ErrorBoundary } from '@kealee/ui'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'OS PM - Project Management',
  description: 'Project Management Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
          <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  )
}
