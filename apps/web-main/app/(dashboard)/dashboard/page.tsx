/**
 * Main Dashboard Page
 * Shows overview for authenticated users
 */

import React from 'react'
import Link from 'next/link'
import { getServerUser } from '@kealee/core-auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userName = user.user_metadata?.fullName || user.email?.split('@')[0]
  const userRole = user.user_metadata?.role || 'USER'
  const company = user.user_metadata?.company || ''

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-blue-100">
          {company && <span>Working with <strong>{company}</strong> • </span>}
          Role: <strong>{userRole}</strong>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Total Services</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
          <Link href="/dashboard/services" className="text-blue-600 text-sm mt-2 hover:text-blue-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Active Projects</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
          <Link href="/dashboard/projects" className="text-blue-600 text-sm mt-2 hover:text-blue-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Messages</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
          <Link href="/dashboard/messages" className="text-blue-600 text-sm mt-2 hover:text-blue-700">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm font-medium">Subscription</div>
          <div className="text-sm font-bold text-green-600 mt-2">Active</div>
          <Link href="/dashboard/billing" className="text-blue-600 text-sm mt-2 hover:text-blue-700">
            Manage →
          </Link>
        </div>
      </div>

      {/* Role-Specific Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userRole === 'USER' && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Start a New Service</h2>
              <div className="space-y-3">
                <Link
                  href="/concept"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">🎨 Concept Design</div>
                  <div className="text-sm text-gray-600">Get AI-powered design concepts</div>
                  <div className="text-sm text-blue-600 mt-2">Starting at $333</div>
                </Link>

                <Link
                  href="/estimation"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">💰 Construction Estimation</div>
                  <div className="text-sm text-gray-600">Detailed cost breakdowns</div>
                  <div className="text-sm text-blue-600 mt-2">Starting at $672</div>
                </Link>

                <Link
                  href="/permits"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="font-semibold text-gray-900">📋 Permit Services</div>
                  <div className="text-sm text-gray-600">Permits + filing support</div>
                  <div className="text-sm text-blue-600 mt-2">Starting at $559</div>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Start a service to get began!</p>
              </div>
            </div>
          </>
        )}

        {userRole === 'PM' && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Projects</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No active projects</p>
                <Link href="/dashboard/projects" className="text-blue-600 mt-2 inline-block">
                  View all projects →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Task Queue</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No pending tasks</p>
                <Link href="/dashboard/tasks" className="text-blue-600 mt-2 inline-block">
                  View all tasks →
                </Link>
              </div>
            </div>
          </>
        )}

        {userRole === 'CONTRACTOR' && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Leads</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No available leads</p>
                <Link href="/dashboard/leads" className="text-blue-600 mt-2 inline-block">
                  View leads →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Quotes</h2>
              <div className="text-center py-8 text-gray-500">
                <p>No pending quotes</p>
                <Link href="/dashboard/quotes" className="text-blue-600 mt-2 inline-block">
                  View quotes →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Getting Started */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900 mb-1">📝 Complete Your Profile</div>
            <p className="text-gray-600">Add your details and preferences</p>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">💳 Add Payment Method</div>
            <p className="text-gray-600">Set up billing for services</p>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">❓ Read the FAQ</div>
            <p className="text-gray-600">Find answers to common questions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
