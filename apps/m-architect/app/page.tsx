import { Metadata } from 'next'
import Link from 'next/link'
import { Check, DraftingCompass, FileText, Users, Clock, Share2, BarChart3, Zap, Layers, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Architect Hub | Kealee Platform - Professional Design Project Management',
  description: 'Manage design projects, deliverables, client reviews, and team collaboration. Seamless integration with permits, engineering, and construction teams.',
  keywords: 'architect software, design project management, architectural deliverables, plan review, design collaboration, construction design',
  openGraph: {
    title: 'Kealee Architect Hub - Professional Design Project Management',
    description: 'Streamline your design workflow with integrated project management, client collaboration, and seamless handoff to permits and construction.',
    type: 'website',
  },
}

export default function ArchitectLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DraftingCompass className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-neutral-900">Kealee Architect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-neutral-700 hover:text-neutral-900"
            >
              Log In
            </Link>
            <Link 
              href="/projects/new" 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Professional Design Workflow</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Design Projects
            <span className="block text-primary mt-2">Done Right</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            The only design platform built for architects working in construction. Manage phases, 
            deliverables, client reviews, and seamlessly hand off to permits—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/projects/new"
              className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
              Start Design Project
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 bg-white border-2 border-neutral-200 text-neutral-900 rounded-lg text-lg font-semibold hover:border-primary transition-colors"
            >
              View Demo
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mt-4">Free for architects • 3% platform fee on projects</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Built for Professional Architects
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Everything you need to manage design projects from pre-design through construction documents
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Phase Management</h3>
            <p className="text-neutral-600">
              Organize projects by phases: Pre-Design, Schematic Design, Design Development, and Construction Documents.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Deliverable Tracking</h3>
            <p className="text-neutral-600">
              Track all design deliverables with status, versions, and approval workflows.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Team Collaboration</h3>
            <p className="text-neutral-600">
              Assign roles (Principal, Project Architect, Designer, Drafter) with appropriate permissions.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Client Review Portal</h3>
            <p className="text-neutral-600">
              Share designs with clients for review and feedback. Collect comments directly on deliverables.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Seamless Handoff</h3>
            <p className="text-neutral-600">
              Direct integration with Kealee Permits. Submit permit applications with one click from completed designs.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Project Integration</h3>
            <p className="text-neutral-600">
              Link to Project Owner projects for budget, timeline, and milestone visibility.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-neutral-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Your Complete Design Workflow
            </h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DraftingCompass className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Project Setup</h3>
                  <p className="text-neutral-600">
                    Link to existing Project Owner projects or create standalone design projects. Define project type, 
                    phases, and assign team members with appropriate roles.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Phase-by-Phase Design</h3>
                  <p className="text-neutral-600">
                    Progress through design phases with clear milestones. Track deliverables, manage versions, 
                    and maintain design history throughout the project lifecycle.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Client Collaboration</h3>
                  <p className="text-neutral-600">
                    Invite clients to review portal for feedback. Collect comments directly on deliverables 
                    and maintain a clear audit trail of all design decisions.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Permit Submission</h3>
                  <p className="text-neutral-600">
                    When designs are complete, submit directly to Kealee Permits module. No file exports, 
                    no separate uploads—seamless handoff to permit processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Why Architects Choose Kealee
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Built for Construction Projects
                </h3>
                <p className="text-neutral-600">
                  Unlike generic design tools, Kealee Architect understands the construction workflow. 
                  Designed to integrate with permits, engineering, and project management from day one.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Save Time on Admin
                </h3>
                <p className="text-neutral-600">
                  Reduce time spent on project management and client coordination. Focus on design while 
                  Kealee handles deliverables tracking, version control, and client feedback collection.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Seamless Permits Integration
                </h3>
                <p className="text-neutral-600">
                  No more exporting files, uploading to permit portals, and tracking separately. 
                  Submit permit applications directly from completed designs with all documentation automatically attached.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Streamline Your Design Workflow?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Join architects managing design projects more efficiently with Kealee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/projects/new"
                className="px-8 py-4 bg-white text-primary rounded-lg text-lg font-semibold hover:bg-neutral-100 transition-colors"
              >
                Start Design Project
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 bg-primary-foreground/10 text-white border-2 border-white/20 rounded-lg text-lg font-semibold hover:bg-primary-foreground/20 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DraftingCompass className="h-6 w-6 text-primary" />
                <span className="text-white font-semibold">Kealee Architect</span>
              </div>
              <p className="text-sm">
                Professional design project management for architects.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/projects/new" className="hover:text-white">New Project</Link></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/login" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Kealee Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
