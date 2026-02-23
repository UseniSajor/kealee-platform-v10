import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Request a Demo | Kealee Operations Services",
  description: "Schedule a personalized demo of Kealee Operations Services. See how our AI-powered platform can streamline your operations, permits, and project management.",
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
