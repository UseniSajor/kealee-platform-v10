'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Icon only */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-20">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-20">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
