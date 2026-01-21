import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ClipboardList, Users, Clock, BarChart3, Shield, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Project Manager Dashboard | Kealee Platform',
  description: 'Professional project management workspace for Kealee operations team. Manage work queues, clients, tasks, and project coordination.',
  keywords: 'construction project management, PM dashboard, work queue management, project coordination',
}

export default function PMLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-neutral-900">Kealee PM Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Project Manager
            <span className="block text-primary mt-2">Workspace</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Professional workspace for Kealee project managers. Manage work queues, client projects, 
            tasks, and coordination workflows all in one place.
          </p>
          <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Complete Project Management Tools
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Work Queue Management</h3>
            <p className="text-neutral-600">
              Prioritized task queues with filtering, sorting, and status tracking for efficient project coordination.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Client Management</h3>
            <p className="text-neutral-600">
              Manage multiple clients and projects with comprehensive overviews and communication tracking.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Time Tracking</h3>
            <p className="text-neutral-600">
              Track time spent on tasks and projects for accurate billing and productivity analysis.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Productivity Dashboard</h3>
            <p className="text-neutral-600">
              Real-time analytics and insights on task completion, client satisfaction, and team performance.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Compliance Tracking</h3>
            <p className="text-neutral-600">
              Monitor permits, inspections, and compliance requirements to ensure project readiness.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Performance Metrics</h3>
            <p className="text-neutral-600">
              Track key performance indicators and generate reports for client communication and internal review.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Access Your Workspace?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Log in to manage your work queues, clients, and projects.
            </p>
            <Link 
              href="/login"
              className="inline-block px-8 py-4 bg-white text-primary rounded-lg text-lg font-semibold hover:bg-neutral-100 transition-colors"
            >
              Log In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="text-white font-semibold">Kealee PM Dashboard</span>
          </div>
          <p className="text-sm">
            Professional project management workspace for Kealee operations team.
          </p>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-sm">
            <p>© {new Date().getFullYear()} Kealee Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

