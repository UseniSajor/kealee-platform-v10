import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  FileText,
  ClipboardList,
  Camera,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Play,
  Shield,
  Users,
  Clock,
  Zap,
  MessageSquare,
  AlertTriangle,
  Hammer,
  HardHat,
  Wrench,
  TrendingUp,
  Bell,
  Smartphone,
  Bot,
  ListChecks,
  FolderOpen,
  Ruler,
  Lock,
  Globe,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'PM Software | Construction Project Management — Kealee',
  description: 'Full-featured construction project management software. Scheduling, budgets, RFIs, submittals, daily logs, punch lists, change orders, and AI-powered command center. Free to start.',
  keywords: 'construction project management, PM software, scheduling, budgets, RFIs, submittals, daily logs, punch lists, change orders, construction software',
  openGraph: {
    title: 'Kealee PM Software — Construction Project Management',
    description: 'Run your entire construction project from one platform. Scheduling, budgets, documents, and AI — all connected.',
    type: 'website',
  },
}

// Feature Card
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-sky-200 transition-all duration-300">
      <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Step Card
function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-sky-600 text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-sky-600 rounded-full flex items-center justify-center text-sm font-bold text-sky-600">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

// Audience Card
function AudienceCard({
  icon,
  title,
  features,
  accent,
}: {
  icon: React.ReactNode
  title: string
  features: string[]
  accent: string
}) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
      <div className={`w-14 h-14 ${accent} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
            <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600 leading-relaxed">{answer}</p>
    </div>
  )
}

export default function PMSoftwareLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/pm" className="flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-sky-600" />
              <span className="text-xl font-bold text-gray-900">Kealee</span>
              <span className="text-sm text-sky-600 font-semibold">PM Software</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                How It Works
              </Link>
              <Link href="#who-its-for" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Who It&apos;s For
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                FAQ
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/pm/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/pm/signup"
                className="px-5 py-2.5 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors shadow-sm"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-sky-900 to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/20 text-sky-300 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Built for Construction. Powered by AI.
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Run Your Entire Project
              <span className="block text-sky-400 mt-2">From One Platform</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Scheduling, budgets, RFIs, submittals, daily logs, punch lists —
              plus an AI command center that does the heavy lifting for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/pm/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-sky-700 rounded-lg text-lg font-bold hover:bg-sky-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-sky-700 transition-all duration-200"
              >
                <Play className="mr-2 h-5 w-5" />
                See Features
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-gray-300 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400" />
                Unlimited projects
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-400" />
                AI command center included
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Spreadsheets and email chains don&apos;t scale.
                  </h2>
                  <p className="text-gray-700 text-lg">
                    Projects stall when RFIs get buried in inboxes, budgets live in Excel, and schedules are out of date before the ink dries. Sound familiar?
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">52%</div>
                  <p className="text-sm text-gray-600">of rework caused by poor data</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">35%</div>
                  <p className="text-sm text-gray-600">of time spent on admin</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">$31B</div>
                  <p className="text-sm text-gray-600">lost to project delays yearly</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">80%</div>
                  <p className="text-sm text-gray-600">of GCs want better tools</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-sky-200">
                <div className="flex items-center gap-3 mb-3">
                  <LayoutDashboard className="h-6 w-6 text-sky-600" />
                  <h3 className="text-lg font-bold text-gray-900">Kealee PM brings it all together</h3>
                </div>
                <p className="text-gray-600">
                  One platform for every part of the job — from pre-construction through closeout. Real-time data,
                  zero double-entry, and an AI assistant that writes your daily logs, generates reports, and flags risks before they become problems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold mb-4">
              EVERYTHING YOU NEED
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for How You Actually Build
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every module connects to every other module. Update a change order and the budget, schedule, and contract adjust automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Calendar className="h-6 w-6 text-sky-600" />}
              title="Scheduling & Gantt Charts"
              description="Drag-and-drop scheduling with critical path tracking. Link tasks, set dependencies, and see your timeline update in real time."
            />
            <FeatureCard
              icon={<DollarSign className="h-6 w-6 text-sky-600" />}
              title="Budget & Cost Tracking"
              description="Track actual vs. estimated costs by line item. Change orders, allowances, and contingencies all flow through one ledger."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-sky-600" />}
              title="RFIs & Submittals"
              description="Create, route, and track RFIs and submittals with full audit trails. Auto-assign reviewers and set response deadlines."
            />
            <FeatureCard
              icon={<ClipboardList className="h-6 w-6 text-sky-600" />}
              title="Daily Logs"
              description="Log weather, manpower, equipment, work performed, and delays. AI can auto-generate entries from your notes and photos."
            />
            <FeatureCard
              icon={<ListChecks className="h-6 w-6 text-sky-600" />}
              title="Punch Lists"
              description="Photo-tagged punch items with assignments and due dates. Track resolution status and generate completion reports."
            />
            <FeatureCard
              icon={<Wrench className="h-6 w-6 text-sky-600" />}
              title="Change Orders"
              description="Document scope changes, get approvals, and auto-update the budget and schedule. Full revision history for every CO."
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6 text-sky-600" />}
              title="Photo Documentation"
              description="Organize site photos by date, location, and trade. Tag photos to RFIs, daily logs, or punch items for full context."
            />
            <FeatureCard
              icon={<FolderOpen className="h-6 w-6 text-sky-600" />}
              title="Document Management"
              description="Plans, specs, contracts, and submittals in one place. Version control, markup tools, and permission-based access."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-sky-600" />}
              title="Reports & Analytics"
              description="Pre-built reports for budget, schedule, safety, and project status. Export to PDF or share live dashboards with stakeholders."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6 text-sky-600" />}
              title="Meetings & Minutes"
              description="Schedule meetings, capture minutes, assign action items, and track follow-ups — all linked to the project record."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-sky-600" />}
              title="Safety Management"
              description="Incident reporting, safety checklists, toolbox talks, and OSHA-compliant documentation. Keep your crews safe and compliant."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6 text-sky-600" />}
              title="AI Command Center"
              description="Generate reports, analyze risk, draft daily logs, compare bids, and review change orders — all with one-click AI assistance."
            />
          </div>
        </div>
      </section>

      {/* AI Command Center Spotlight */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-8 md:p-12 border border-sky-200">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold mb-4">
                    <Zap className="h-3 w-3" />
                    POWERED BY AI
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    The Command Center Does the Work You Hate
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Stop spending hours on reports, risk assessments, and bid comparisons. The AI Command Center analyzes
                    your project data and delivers insights in seconds — not days.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Auto-generate daily log entries from notes & photos',
                      'One-click project status reports for stakeholders',
                      'AI risk analysis flags problems before they happen',
                      'Side-by-side bid comparisons with recommendations',
                      'Change order impact analysis on budget & schedule',
                      'Photo analysis for progress tracking & documentation',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-64 h-64 bg-gradient-to-br from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Bot className="h-24 w-24 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Up and Running in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No training sessions. No IT department. Just sign up and start building.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative">
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-sky-200 -z-10"></div>

              <StepCard
                number={1}
                title="Create a Project"
                description="Enter your project info, upload plans, and invite your team"
                icon={<FolderOpen className="h-7 w-7" />}
              />
              <StepCard
                number={2}
                title="Set Up Your Schedule"
                description="Build your timeline with tasks, milestones, and dependencies"
                icon={<Calendar className="h-7 w-7" />}
              />
              <StepCard
                number={3}
                title="Manage the Build"
                description="Log daily activity, track RFIs, process COs, and document everything"
                icon={<Hammer className="h-7 w-7" />}
              />
              <StepCard
                number={4}
                title="Close It Out"
                description="Complete punch lists, generate final reports, and archive the project"
                icon={<CheckCircle className="h-7 w-7" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="who-its-for" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Role on the Job
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you&apos;re running the crew, managing the budget, or overseeing the project — Kealee PM works for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <AudienceCard
              icon={<HardHat className="h-7 w-7 text-orange-600" />}
              title="General Contractors"
              accent="bg-orange-100"
              features={[
                'Full project scheduling & Gantt charts',
                'Budget tracking with real-time cost data',
                'Subcontractor coordination & payments',
                'Daily logs, photos & safety management',
                'AI-generated reports for owners & banks',
              ]}
            />
            <AudienceCard
              icon={<Users className="h-7 w-7 text-sky-600" />}
              title="Project Managers"
              accent="bg-sky-100"
              features={[
                'RFI & submittal tracking with deadlines',
                'Change order workflow & approvals',
                'Meeting minutes & action item tracking',
                'Multi-project dashboards & analytics',
                'Stakeholder reporting in one click',
              ]}
            />
            <AudienceCard
              icon={<TrendingUp className="h-7 w-7 text-emerald-600" />}
              title="Owners & Developers"
              accent="bg-emerald-100"
              features={[
                'Real-time budget & schedule visibility',
                'Photo documentation & progress tracking',
                'Milestone payment approvals',
                'Punch list status & completion tracking',
                'Full project archive & closeout reports',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Platform Integration */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Connected to the Full Kealee Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                PM Software is one piece of the platform. Every module shares data — no re-entry, no silos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Ruler className="h-5 w-5" />, title: 'Cost Estimation', desc: 'Estimates flow directly into project budgets', color: 'bg-orange-100 text-orange-600' },
                { icon: <Shield className="h-5 w-5" />, title: 'Permits & Inspections', desc: 'Inspection results update schedules automatically', color: 'bg-purple-100 text-purple-600' },
                { icon: <DollarSign className="h-5 w-5" />, title: 'Milestone Payments', desc: 'Approved milestones trigger payment releases', color: 'bg-emerald-100 text-emerald-600' },
                { icon: <Globe className="h-5 w-5" />, title: 'Contractor Network', desc: 'Invite vetted subs directly into your project', color: 'bg-sky-100 text-sky-600' },
                { icon: <FileText className="h-5 w-5" />, title: 'Architecture & Engineering', desc: 'Design documents sync to project files', color: 'bg-indigo-100 text-indigo-600' },
                { icon: <Wrench className="h-5 w-5" />, title: 'Operations Services', desc: 'Outsourced PM team plugs right into your project', color: 'bg-rose-100 text-rose-600' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                  <div className={`w-11 h-11 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Pricing, No Surprises
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Free */}
              <div className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  Free
                </div>
                <p className="text-gray-500 mb-6">For small projects</p>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  {[
                    'Up to 3 active projects',
                    'Scheduling & Gantt charts',
                    'Budget tracking',
                    'Daily logs & photos',
                    'RFIs & submittals',
                    'Punch lists',
                    '5 team members per project',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pm/signup"
                  className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="relative p-8 bg-white rounded-2xl border-2 border-sky-500 shadow-lg hover:shadow-xl transition-all">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold bg-sky-500 text-white rounded-full">
                  MOST POPULAR
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  $149
                  <span className="text-lg font-normal text-gray-500">/mo</span>
                </div>
                <p className="text-gray-500 mb-6">For growing teams</p>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  {[
                    'Unlimited projects',
                    'Everything in Starter',
                    'AI Command Center',
                    'Change order workflows',
                    'Advanced reporting & analytics',
                    'Document versioning & markup',
                    'Unlimited team members',
                    'Safety management',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pm/signup?plan=pro"
                  className="block w-full text-center px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                >
                  Start 14-Day Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  Custom
                </div>
                <p className="text-gray-500 mb-6">For large organizations</p>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  {[
                    'Everything in Professional',
                    'Multi-company collaboration',
                    'Custom integrations & API access',
                    'SSO & advanced security',
                    'Dedicated account manager',
                    'Custom onboarding & training',
                    'SLA & uptime guarantees',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="Is it really free to start?"
              answer="Yes. The Starter plan is completely free — no credit card required. You get scheduling, budgets, daily logs, RFIs, submittals, and punch lists for up to 3 projects. Upgrade to Professional when you need AI, advanced reporting, or unlimited projects."
            />
            <FAQItem
              question="Can I import data from Procore, Buildertrend, or other PM tools?"
              answer="Yes. We support CSV imports for projects, budgets, schedules, and contacts. If you're migrating from another platform, our team can help with the transition."
            />
            <FAQItem
              question="Does this work on mobile?"
              answer="Absolutely. Kealee PM works in any browser on any device. Take photos, log daily work, review RFIs, and approve change orders from the field — no app download required."
            />
            <FAQItem
              question="How does the AI Command Center work?"
              answer="The Command Center uses AI to analyze your project data and generate outputs like daily log drafts, status reports, risk assessments, and bid comparisons. It reads your project — you don't have to type long prompts. One click, instant results."
            />
            <FAQItem
              question="Can my subs and owners access the platform?"
              answer="Yes. You control who sees what. Invite subcontractors to view schedules and submit daily logs. Give owners read-only access to budgets, photos, and reports. Everyone stays in the loop without seeing things they shouldn't."
            />
            <FAQItem
              question="How does this connect to Milestone Payments?"
              answer="When you approve a milestone in PM Software, it can trigger a payment release through Kealee's Milestone Payments module. Budget data flows both ways — payment approvals automatically update your project financials."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-sky-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Build Smarter?
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              Join contractors and project managers who run their projects on Kealee PM.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pm/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-sky-700 rounded-lg text-lg font-bold hover:bg-sky-50 transition-all duration-200 shadow-lg"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-sky-700 transition-all duration-200"
              >
                Talk to Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Already a user? */}
      <div className="text-center text-sm text-gray-500 py-6 bg-gray-100">
        <p>
          Already have an account?{' '}
          <Link href="/pm/login" className="text-sky-600 hover:text-sky-700 underline">
            Sign in to your PM dashboard
          </Link>.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="h-6 w-6 text-sky-500" />
                <span className="text-white font-bold text-lg">Kealee PM</span>
              </div>
              <p className="text-sm leading-relaxed">
                Full-featured construction project management software. Scheduling, budgets, documents, and AI — all in one platform.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/pm/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/estimation" className="hover:text-white transition-colors">Cost Estimation</Link></li>
                <li><Link href="/permits" className="hover:text-white transition-colors">Permits & Inspections</Link></li>
                <li><Link href="/finance" className="hover:text-white transition-colors">Milestone Payments</Link></li>
                <li><Link href="/network" className="hover:text-white transition-colors">Contractor Network</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Kealee</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/data-deletion" className="hover:text-white transition-colors">Data Deletion</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Kealee Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
