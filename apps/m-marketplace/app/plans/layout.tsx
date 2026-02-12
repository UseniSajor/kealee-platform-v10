import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Stock House Plans | Kealee',
  description: 'Browse thousands of ready-to-build house plans from licensed architects and designers. Filter by style, size, bedrooms, and more.',
}

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">
        {children}
      </main>
      <Footer />
    </>
  )
}
