import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ErrorBoundary } from "@kealee/ui"
import { Toaster } from "sonner"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kealee Architect Hub",
  description: "Professional design project management for architects",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
