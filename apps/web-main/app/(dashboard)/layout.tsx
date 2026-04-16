/**
 * Dashboard Layout
 * Protected layout for authenticated users
 */

import React from 'react'
import Link from 'next/link'
import { getServerUser } from '@kealee/core-auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Require authentication
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userName = user.user_metadata?.fullName || user.email?.split('@')[0] || 'User'
  const userRole = user.user_metadata?.role || 'USER'

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Kealee</h1>
        </div>

        <nav className="p-4 space-y-2">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
          >
            📊 Dashboard
          </Link>

          {/* Role-based navigation */}
          {userRole === 'PM' && (
            <>
              <Link
                href="/dashboard/projects"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                📁 Projects
              </Link>
              <Link
                href="/dashboard/clients"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                👥 Clients
              </Link>
              <Link
                href="/dashboard/tasks"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                ✓ Tasks
              </Link>
            </>
          )}

          {userRole === 'CONTRACTOR' && (
            <>
              <Link
                href="/dashboard/leads"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                🎯 Leads
              </Link>
              <Link
                href="/dashboard/quotes"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                💰 Quotes
              </Link>
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                👤 Profile
              </Link>
            </>
          )}

          {userRole === 'USER' && (
            <>
              <Link
                href="/dashboard/projects"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                📁 My Projects
              </Link>
              <Link
                href="/dashboard/services"
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                🔧 Services
              </Link>
            </>
          )}

          {/* Common */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link
              href="/dashboard/messages"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              💬 Messages
            </Link>
            <Link
              href="/dashboard/billing"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              💳 Billing
            </Link>
            <Link
              href="/dashboard/settings"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              ⚙️ Settings
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Welcome, {userName}</h2>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">🔔</button>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <Link href="/auth/logout" className="text-sm text-gray-600 hover:text-gray-900">
                Sign out
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
