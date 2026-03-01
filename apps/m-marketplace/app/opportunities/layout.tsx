import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-16">{children}</div>
      <Footer />
    </>
  )
}
