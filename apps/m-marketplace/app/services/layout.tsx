import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
