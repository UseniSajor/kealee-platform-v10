import { Metadata } from 'next'
import Link from 'next/link'
import { DraftingCompass, FileText, Users, Clock, Share2, BarChart3, Briefcase, Building, Send, FolderOpen, UserCheck, ArrowRight, ShoppingCart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Design Professional Portal | Kealee',
  description: 'Portal for Kealee design professionals. Manage project owner design requests, marketplace walk-ins, and coordinate permit submissions.',
  keywords: 'architect portal, design professional, construction design services, permit coordination',
  openGraph: {
    title: 'Kealee Design Professional Portal',
    description: 'Manage design projects for project owners and marketplace clients. Seamless permit coordination.',
    type: 'website',
  },
}

export default function ArchitectPortalPage() {
  const stats = [
    { label: 'Active Projects', value: '24', change: '+3 this week' },
    { label: 'Pending Reviews', value: '8', change: '5 urgent' },
    { label: 'Permits Submitted', value: '12', change: 'This month' },
    { label: 'Client Approvals', value: '6', change: 'Awaiting' },
  ]

  const projectSources = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Project Owner Requests',
      description: 'Design projects from project owners who purchased design packages through m-ops-services or m-project-owner.',
      count: '14 active',
      color: 'bg-blue-500',
      link: '/projects?source=owner',
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: 'Marketplace Walk-ins',
      description: 'Clients who found us through the marketplace needing architectural design services.',
      count: '10 active',
      color: 'bg-emerald-500',
      link: '/projects?source=marketplace',
    },
  ]

  const quickActions = [
    { icon: <FolderOpen className="h-5 w-5" />, label: 'View All Projects', href: '/projects' },
    { icon: <FileText className="h-5 w-5" />, label: 'Pending Deliverables', href: '/deliverables' },
    { icon: <UserCheck className="h-5 w-5" />, label: 'Client Reviews', href: '/reviews' },
    { icon: <Send className="h-5 w-5" />, label: 'Submit to Permits', href: '/permits/submit' },
  ]

  const recentProjects = [
    { id: 'PRJ-2024-001', name: 'Smith Residence Addition', client: 'John Smith', source: 'Project Owner', phase: 'Construction Documents', status: 'In Progress', permitReady: true },
    { id: 'PRJ-2024-002', name: 'Downtown Office Buildout', client: 'ABC Corp', source: 'Marketplace', phase: 'Design Development', status: 'Client Review', permitReady: false },
    { id: 'PRJ-2024-003', name: 'Garcia Kitchen Remodel', client: 'Maria Garcia', source: 'Project Owner', phase: 'Schematic Design', status: 'In Progress', permitReady: false },
    { id: 'PRJ-2024-004', name: 'Historic Rowhouse Renovation', client: 'Heritage LLC', source: 'Marketplace', phase: 'Construction Documents', status: 'Pending Approval', permitReady: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <DraftingCompass className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Design Portal</span>
              <span className="text-xs text-gray-500 block">Kealee Architecture Services</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/schedule" className="text-gray-600 hover:text-gray-900 text-sm">
              Schedule
            </Link>
            <Link href="/team" className="text-gray-600 hover:text-gray-900 text-sm">
              Team
            </Link>
            <button id="cart-trigger" className="relative text-gray-700 hover:text-blue-600 transition" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <Link
              href="/login"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Design Professional Portal</h1>
          <p className="text-gray-600 mt-1">
            Manage design projects for project owners and marketplace clients
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Project Sources */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {projectSources.map((source) => (
            <Link
              key={source.title}
              href={source.link}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${source.color} rounded-lg flex items-center justify-center text-white`}>
                  {source.icon}
                </div>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {source.count}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-indigo-600 transition-colors">
                {source.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{source.description}</p>
              <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium mt-4">
                View Projects <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div className="text-indigo-600">{action.icon}</div>
                <span className="text-sm font-medium text-gray-900">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Permit Coordination Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Permit Coordination</h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Submit completed designs directly to m-permits for plan review and permit applications.
                  Track submission status and respond to review comments.
                </p>
              </div>
            </div>
            <Link
              href="/permits/submit"
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              Submit to Permits
            </Link>
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permit Ready</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.client}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        project.source === 'Project Owner'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {project.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.phase}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'Client Review' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {project.permitReady ? (
                        <Link
                          href={`/permits/submit?project=${project.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          <Send className="h-3 w-3" /> Submit
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">Not ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Design Workflow</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">1. Receive Request</h4>
              <p className="text-xs text-gray-500 mt-1">From project owners or marketplace</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DraftingCompass className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900">2. Design Phases</h4>
              <p className="text-xs text-gray-500 mt-1">SD → DD → CD with client reviews</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">3. Client Approval</h4>
              <p className="text-xs text-gray-500 mt-1">Get sign-off on final designs</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-medium text-gray-900">4. Submit to Permits</h4>
              <p className="text-xs text-gray-500 mt-1">Direct handoff to m-permits</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <DraftingCompass className="h-5 w-5 text-indigo-400" />
              <span className="text-white font-medium">Kealee Design Portal</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/help" className="hover:text-white">Help</Link>
              <Link href="/team" className="hover:text-white">Team</Link>
              <Link href="https://kealee.com" className="hover:text-white">Main Site</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
            <p>© {new Date().getFullYear()} Kealee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
