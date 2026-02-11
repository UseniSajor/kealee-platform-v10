import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

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
