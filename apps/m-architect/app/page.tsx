'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Check, DraftingCompass, FileText, Users, Clock, Share2, BarChart3, Zap, Layers, Eye, ArrowRight, Sparkles, Building2, Award, TrendingUp } from 'lucide-react'

// SEO Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Kealee Architect Hub",
  "description": "Professional design project management platform for architects. Manage design projects, deliverables, client reviews, and team collaboration with seamless integration to permits, engineering, and construction teams.",
  "provider": {
    "@type": "Organization",
    "name": "Kealee Platform",
    "url": "https://kealee.com"
  },
  "serviceType": "Architecture Project Management Software",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Architect Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Phase Management",
          "description": "Organize projects by phases: Pre-Design, Schematic Design, Design Development, and Construction Documents."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Deliverable Tracking",
          "description": "Track all design deliverables with status, versions, and approval workflows."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Client Review Portal",
          "description": "Share designs with clients for review and feedback. Collect comments directly on deliverables."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Permit Integration",
          "description": "Direct integration with permit systems. Submit permit applications with one click from completed designs."
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "2847",
    "bestRating": "5"
  }
}

// Animated Counter Hook
function useCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * (end - start) + start))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, start, duration])

  return { count, ref }
}

// Stats Counter Component
function StatCounter({ value, suffix = '', label, icon: Icon }: { value: number; suffix?: string; label: string; icon: React.ElementType }) {
  const { count, ref } = useCounter(value, 2500)

  return (
    <div ref={ref} className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-4xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-sm text-neutral-500 mt-1 font-medium">{label}</div>
      </div>
    </div>
  )
}

export default function ArchitectLandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-neutral-50 overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-neutral-50 to-neutral-100" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        {/* Navigation */}
        <nav className="border-b border-white/20 bg-white/60 backdrop-blur-xl sticky top-0 z-50 shadow-sm shadow-neutral-200/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <DraftingCompass className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">Kealee Architect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/projects/new"
                className="group relative px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-16 text-center relative">
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-primary/20 text-primary rounded-full text-sm font-semibold mb-8 shadow-lg shadow-primary/10">
              <Sparkles className="h-4 w-4" />
              <span>Professional Design Workflow Platform</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
              <span className="inline-block">Design Projects</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary/90 to-blue-600 bg-clip-text text-transparent pb-2">
                Done Right
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              The only design platform built for architects working in construction. Manage phases,
              deliverables, client reviews, and seamlessly hand off to permits
              <span className="text-primary font-semibold"> - all in one place.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/projects/new"
                className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-2xl text-lg font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Design Project
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/login"
                className="group px-8 py-4 bg-white/80 backdrop-blur-xl border-2 border-neutral-200 text-neutral-900 rounded-2xl text-lg font-semibold hover:border-primary/50 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  View Demo
                </span>
              </Link>
            </div>

            {/* Trust Badge */}
            <p className="text-sm text-neutral-500 flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Free for architects
              <span className="text-neutral-300">|</span>
              <Check className="h-4 w-4 text-green-500" />
              3% platform fee on projects
              <span className="text-neutral-300">|</span>
              <Check className="h-4 w-4 text-green-500" />
              No credit card required
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <StatCounter value={2847} label="Active Architects" icon={Users} />
            <StatCounter value={12500} suffix="+" label="Projects Completed" icon={Building2} />
            <StatCounter value={98} suffix="%" label="Client Satisfaction" icon={Award} />
            <StatCounter value={45} suffix="%" label="Time Saved" icon={TrendingUp} />
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              <Layers className="h-4 w-4" />
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Built for Professional
              <span className="block text-primary">Architects</span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Everything you need to manage design projects from pre-design through construction documents
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature Cards with Glassmorphism */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                  <Layers className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Phase Management</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Organize projects by phases: Pre-Design, Schematic Design, Design Development, and Construction Documents.
                </p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Deliverable Tracking</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Track all design deliverables with status, versions, and approval workflows.
                </p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Team Collaboration</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Assign roles (Principal, Project Architect, Designer, Drafter) with appropriate permissions.
                </p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Client Review Portal</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Share designs with clients for review and feedback. Collect comments directly on deliverables.
                </p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Seamless Handoff</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Direct integration with Kealee Permits. Submit permit applications with one click from completed designs.
                </p>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-red-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-8 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Project Integration</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Link to Project Owner projects for budget, timeline, and milestone visibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-100/80 to-white/50 backdrop-blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                <Zap className="h-4 w-4" />
                Workflow
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Your Complete Design
                <span className="block text-primary">Workflow</span>
              </h2>
            </div>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Workflow Step 1 */}
              <div className="group relative">
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent h-full hidden md:block" />
                <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                        <DraftingCompass className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold text-sm shadow-md">
                        1
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Project Setup</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        Link to existing Project Owner projects or create standalone design projects. Define project type,
                        phases, and assign team members with appropriate roles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Workflow Step 2 */}
              <div className="group relative">
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent h-full hidden md:block" />
                <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                        <Layers className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-500 font-bold text-sm shadow-md">
                        2
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Phase-by-Phase Design</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        Progress through design phases with clear milestones. Track deliverables, manage versions,
                        and maintain design history throughout the project lifecycle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Workflow Step 3 */}
              <div className="group relative">
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent h-full hidden md:block" />
                <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 font-bold text-sm shadow-md">
                        3
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Client Collaboration</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        Invite clients to review portal for feedback. Collect comments directly on deliverables
                        and maintain a clear audit trail of all design decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Workflow Step 4 */}
              <div className="group relative">
                <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                        <Share2 className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 font-bold text-sm shadow-md">
                        4
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Permit Submission</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        When designs are complete, submit directly to Kealee Permits module. No file exports,
                        no separate uploads - seamless handoff to permit processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
                <Award className="h-4 w-4" />
                Benefits
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Why Architects
                <span className="block text-primary">Choose Kealee</span>
              </h2>
            </div>
            <div className="space-y-8">
              {/* Benefit 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex gap-6 p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                      Built for Construction Projects
                    </h3>
                    <p className="text-lg text-neutral-600 leading-relaxed">
                      Unlike generic design tools, Kealee Architect understands the construction workflow.
                      Designed to integrate with permits, engineering, and project management from day one.
                    </p>
                  </div>
                </div>
              </div>
              {/* Benefit 2 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex gap-6 p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                      Save Time on Admin
                    </h3>
                    <p className="text-lg text-neutral-600 leading-relaxed">
                      Reduce time spent on project management and client coordination. Focus on design while
                      Kealee handles deliverables tracking, version control, and client feedback collection.
                    </p>
                  </div>
                </div>
              </div>
              {/* Benefit 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex gap-6 p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Share2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                      Seamless Permits Integration
                    </h3>
                    <p className="text-lg text-neutral-600 leading-relaxed">
                      No more exporting files, uploading to permit portals, and tracking separately.
                      Submit permit applications directly from completed designs with all documentation automatically attached.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-blue-600" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          </div>
          <div className="container mx-auto px-4 text-center relative">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full text-sm font-semibold mb-8">
                <Sparkles className="h-4 w-4" />
                Start Today
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Streamline Your
                <span className="block mt-2">Design Workflow?</span>
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join architects managing design projects more efficiently with Kealee.
                Get started in minutes, not days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/projects/new"
                  className="group px-8 py-4 bg-white text-primary rounded-2xl text-lg font-semibold hover:bg-neutral-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-2">
                    Start Design Project
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 rounded-2xl text-lg font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  View Demo
                </Link>
              </div>
              <div className="mt-10 flex items-center justify-center gap-6 text-white/70 text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-neutral-900 text-neutral-400 py-16 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-neutral-900" />
          <div className="container mx-auto px-4 relative">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <DraftingCompass className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-lg">Kealee Architect</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Professional design project management for architects. Streamline your workflow from concept to construction.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/projects/new" className="hover:text-white transition-colors">New Project</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm">&copy; {new Date().getFullYear()} Kealee Platform. All rights reserved.</p>
              <div className="flex items-center gap-6 text-sm">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
