import { Metadata } from 'next'
import Link from 'next/link'
import { Check, Home, Shield, TrendingUp, Clock, DollarSign, Users, FileCheck, BarChart3, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Project Owner Portal | Kealee Platform - Construction Project Management',
  description: 'Manage your construction projects from start to finish. Track readiness, contracts, milestones, payments, and progress all in one integrated platform.',
  keywords: 'construction project management, project owner portal, construction milestones, escrow management, contractor management',
  openGraph: {
    title: 'Kealee Project Owner Portal - Complete Construction Project Management',
    description: 'Take control of your construction projects with integrated project management, financial escrow, and contractor coordination.',
    type: 'website',
  },
}

export default function ProjectOwnerLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-neutral-900">Kealee Project Owner</span>
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
            <span>Complete Project Control</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Build with
            <span className="block text-primary mt-2">Complete Confidence</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            The only platform that gives property owners full visibility and control over construction projects. 
            From readiness checklists to milestone payments—everything in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/projects/new"
              className="px-8 py-4 bg-primary text-white rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
            >
              Start Your Project
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 bg-white border-2 border-neutral-200 text-neutral-900 rounded-lg text-lg font-semibold hover:border-primary transition-colors"
            >
              View Demo
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mt-4">No setup fees • 3% platform fee • Transparent pricing</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Everything You Need to Manage Your Project
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Built specifically for property owners managing construction projects
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Readiness Checklists</h3>
            <p className="text-neutral-600">
              Comprehensive pre-construction checklists ensure you're ready before breaking ground.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Contract Management</h3>
            <p className="text-neutral-600">
              Digital contracts with milestone gates. Approve milestones only when work is verified complete.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Escrow Protection</h3>
            <p className="text-neutral-600">
              Secure escrow accounts with automatic release gates. Funds only release when milestones pass inspection.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Project Timeline</h3>
            <p className="text-neutral-600">
              Visual timeline tracking from design through completion. Automatic updates from all integrated modules.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Team Coordination</h3>
            <p className="text-neutral-600">
              Connect with architects, engineers, contractors, and inspectors. All communication in one place.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Progress Tracking</h3>
            <p className="text-neutral-600">
              Real-time updates on milestone completion, inspections, permits, and payments.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Simple steps to get your project started
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Create Project</h3>
              <p className="text-neutral-600 text-sm">
                Set up your project with details, timeline, and budget
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Complete Readiness</h3>
              <p className="text-neutral-600 text-sm">
                Work through checklists to ensure project readiness
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Approve Contracts</h3>
              <p className="text-neutral-600 text-sm">
                Review and approve contractor contracts with milestone gates
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Track Progress</h3>
              <p className="text-neutral-600 text-sm">
                Monitor milestones, approve payments, and track completion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Why Property Owners Choose Kealee
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Automatic Compliance Gates
                </h3>
                <p className="text-neutral-600">
                  Escrow won't release if permits expire. Milestones can't be approved without passing inspections. 
                  Your project stays compliant automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Complete Visibility
                </h3>
                <p className="text-neutral-600">
                  See everything in one dashboard: design progress, permit status, inspection results, 
                  milestone completion, and payment history. No more juggling multiple systems.
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
                  Save Time & Money
                </h3>
                <p className="text-neutral-600">
                  Reduce project delays with integrated workflows. Catch issues early before they become costly problems. 
                  Automated compliance checks prevent expensive rework.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="bg-neutral-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Fully Integrated Platform
              </h2>
              <p className="text-lg text-neutral-600">
                Connect seamlessly with all Kealee modules
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Architect Hub</h3>
                <p className="text-neutral-600 text-sm">
                  Automatic updates when designs are complete. Direct handoff to permits module.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Permits & Inspections</h3>
                <p className="text-neutral-600 text-sm">
                  Permits automatically linked to project timeline. Inspection results block milestone approvals.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Finance & Trust</h3>
                <p className="text-neutral-600 text-sm">
                  Secure escrow with automatic release gates. Milestone payments only when work passes inspection.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Contractor Marketplace</h3>
                <p className="text-neutral-600 text-sm">
                  Find verified contractors. Track their performance. Manage contracts all in one place.
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
              Ready to Take Control of Your Project?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Start your construction project with confidence. Complete control, full visibility, automatic compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/projects/new"
                className="px-8 py-4 bg-white text-primary rounded-lg text-lg font-semibold hover:bg-neutral-100 transition-colors"
              >
                Start Your Project
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
                <Home className="h-6 w-6 text-primary" />
                <span className="text-white font-semibold">Kealee Project Owner</span>
              </div>
              <p className="text-sm">
                Complete construction project management for property owners.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/projects/new" className="hover:text-white">Create Project</Link></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/login" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">Support</Link></li>
                <li><Link href="#" className="hover:text-white">FAQ</Link></li>
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
