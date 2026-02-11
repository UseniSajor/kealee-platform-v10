// ============================================================
// HOME PAGE
// Shows landing page for unauthenticated users
// Redirects authenticated users to dashboard
// ============================================================

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import Link from 'next/link'
import { Check, Building2, FileCheck, Clock, Shield, Zap, Users, BarChart3, ShoppingCart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Permits & Inspections Management Platform | Kealee',
  description: 'Streamline permit applications, plan reviews, and inspections for building departments, contractors, and property owners. AI-powered compliance, digital workflows, and seamless integrations.',
  keywords: 'permit management, building permits, inspection scheduling, plan review, building department software, permit tracking',
  openGraph: {
    title: 'Kealee Permits & Inspections - Modern Permit Management Platform',
    description: 'Digital permit processing, AI-powered compliance checks, and inspection management all in one platform.',
    type: 'website',
  },
}

export default async function HomePage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-neutral-900">Kealee Permits</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/public/search" className="text-neutral-600 hover:text-neutral-900">
              Search Permits
            </Link>
            <button id="cart-trigger" className="relative text-gray-700 hover:text-blue-600 transition" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <Link
              href="/auth/login"
              className="px-4 py-2 text-neutral-700 hover:text-neutral-900"
            >
              Log In
            </Link>
            <Link 
              href="/auth/login" 
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Get Approved 40% Faster with AI Review</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Getting Permits Doesn&apos;t Have to Be Painful
            <span className="block text-emerald-600 mt-2">We Make It Easy</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-4 max-w-2xl mx-auto">
            Stop worrying about permits slowing down your project. Our AI catches errors before you submit, and we track everything until approval.
          </p>
          <p className="text-lg text-neutral-500 mb-8 max-w-2xl mx-auto">
            ✅ No more rejected applications • ✅ No more chasing status • ✅ Average approval in 14 days
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/permits/new"
              className="px-8 py-4 bg-emerald-600 text-white rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg inline-flex items-center justify-center gap-2"
            >
              Start Your Permit Application
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/public/search"
              className="px-8 py-4 bg-white border-2 border-neutral-200 text-neutral-900 rounded-lg text-lg font-semibold hover:border-emerald-600 transition-colors"
            >
              Check Permit Status
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            💚 Takes 5 minutes • AI reviews instantly • No payment until submission
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Everything You Need for Permit Management
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Built for building departments, contractors, and property owners
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Digital Applications</h3>
            <p className="text-neutral-600">
              Multi-step wizard with AI pre-review. Upload plans, calculate fees, and submit in minutes.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Plan Review Tools</h3>
            <p className="text-neutral-600">
              PDF markup, comment threads, and discipline-specific workflows for efficient reviews.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Inspection Scheduling</h3>
            <p className="text-neutral-600">
              Calendar-based scheduling with route optimization and mobile inspector app integration.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI Compliance Check</h3>
            <p className="text-neutral-600">
              Automatic code compliance verification before submission saves time and reduces rejections.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Real-Time Tracking</h3>
            <p className="text-neutral-600">
              Track permit status, review progress, and inspection results from anywhere.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Multi-Jurisdiction</h3>
            <p className="text-neutral-600">
              Manage permits across multiple jurisdictions with jurisdiction-specific workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-neutral-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Built for Everyone in Construction
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Building Departments</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Replace legacy permit systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Digital application intake</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Inspection scheduling calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Public transparency portal</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Contractors</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Online permit applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Real-time status tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Expedited processing option</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Integration with design software</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Property Owners</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Track all project permits</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Linked to project timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Automatic compliance gates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-600">Public permit search</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Why Choose Kealee Permits?
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
                  AI-Powered Pre-Review
                </h3>
                <p className="text-neutral-600">
                  Our AI analyzes your permit application before submission, catching common issues 
                  and code violations early. Save time and reduce rejections by up to 60%.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Seamless Integration
                </h3>
                <p className="text-neutral-600">
                  Connect with Kealee Architect for direct design handoff, Kealee Project Owner 
                  for automatic timeline updates, and Kealee Finance for compliance enforcement. 
                  All in one platform.
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
                  Faster Processing
                </h3>
                <p className="text-neutral-600">
                  Expedited processing available with 48-72 hour review guarantees. Digital workflows 
                  eliminate paperwork delays and enable faster approvals.
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
              Ready to Streamline Your Permit Process?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Join building departments, contractors, and property owners using Kealee Permits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/login"
                className="px-8 py-4 bg-white text-primary rounded-lg text-lg font-semibold hover:bg-neutral-100 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/public/search"
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
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-white font-semibold">Kealee Permits</span>
              </div>
              <p className="text-sm">
                Modern permit and inspection management for the construction industry.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/public/search" className="hover:text-white">Public Search</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Building Departments</Link></li>
                <li><Link href="#" className="hover:text-white">Contractors</Link></li>
                <li><Link href="#" className="hover:text-white">Property Owners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Kealee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
