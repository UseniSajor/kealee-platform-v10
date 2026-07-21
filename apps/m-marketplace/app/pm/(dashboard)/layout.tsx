import { Header } from "@pm/components/layout/Header"
import { MobileNav } from "@pm/components/layout/MobileNav"
import { Sidebar } from "@pm/components/layout/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header leftSlot={<MobileNav />} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}


