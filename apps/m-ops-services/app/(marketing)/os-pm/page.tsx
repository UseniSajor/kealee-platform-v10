import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Project Management for Contractors | Kealee Platform',
  description: 'Construction project management tools for contractors and builders. Milestone tracking, payment requests, and client communication.',
};

export default function ProjectManagementPage() {
  const features = [
    {
      icon: '📋',
      title: 'Milestone Tracking',
      description: 'Track project phases with customizable milestones and automatic client notifications.',
    },
    {
      icon: '📸',
      title: 'Progress Documentation',
      description: 'Capture and organize site photos with date stamps and location tagging for client updates.',
    },
    {
      icon: '💰',
      title: 'Payment Management',
      description: 'Submit milestone completion requests and track payment status in real-time.',
    },
    {
      icon: '👥',
      title: 'Subcontractor Coordination',
      description: 'Centralized communication hub for your crews, subs, and project stakeholders.',
    },
    {
      icon: '📅',
      title: 'Schedule Management',
      description: 'Gantt charts, critical path tracking, and automated delay notifications.',
    },
    {
      icon: '📄',
      title: 'Document Control',
      description: 'Secure storage for contracts, drawings, RFIs, and submittals with version control.',
    },
  ];

  const modules = [
    {
      title: 'Contractor Dashboard',
      description: 'Your command center for managing active projects, tracking payments, and coordinating with clients.',
      features: ['Active projects', 'Payment status', 'Upcoming milestones', 'Client messages'],
    },
    {
      title: 'Project Execution',
      description: 'Tools to manage construction phases from groundbreaking to final walkthrough.',
      features: ['Task management', 'Payment requests', 'RFI submission', 'Change order tracking'],
    },
    {
      title: 'Weekly Reporting',
      description: 'Automated weekly reports sent to clients with customizable templates.',
      features: ['Progress summary', 'Issues & risks', 'Next week lookahead', 'Photo documentation'],
    },
    {
      title: 'Mobile App',
      description: 'Full functionality on iOS and Android for on-site updates and communication.',
      features: ['Offline mode', 'Photo capture', 'Push notifications', 'Quick updates'],
    },
  ];

  const integrations = [
    'QuickBooks',
    'Procore',
    'Google Drive',
    'Dropbox',
    'DocuSign',
    'Slack',
    'Microsoft Teams',
    'Zapier',
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      {/* Hero */}
      <div className="text-center mb-16">
        <span className="inline-block rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-700 mb-4">
          FOR CONTRACTORS & BUILDERS
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Project Management
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Built for contractors. Manage your construction projects, coordinate with clients,
          and get paid faster with escrow-backed milestone payments.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            Start Free Trial
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            See Demo
          </Link>
        </div>
      </div>

      {/* Core Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-3 font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Modules */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Platform Modules</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <div
              key={module.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-black mb-2">{module.title}</h3>
              <p className="text-sm text-zinc-600 mb-4">{module.description}</p>
              <div className="flex flex-wrap gap-2">
                {module.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ops Services Integration */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">
                INTEGRATED SERVICE
              </span>
              <h2 className="text-2xl font-black">
                Add Operations Support
              </h2>
              <p className="mt-2 max-w-xl text-zinc-700">
                Combine our PM platform with professional operations support. Let us handle
                permits, vendor coordination, and weekly reporting while you focus on building.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Permit tracking
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Vendor follow-ups
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Weekly reports
                </div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 whitespace-nowrap"
            >
              View Packages →
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="mb-16">
        <h2 className="text-xl font-black text-center mb-6">Integrations</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {integrations.map((integration) => (
            <span
              key={integration}
              className="px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium"
            >
              {integration}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-zinc-500 mt-4">
          Plus 100+ more via Zapier
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-[var(--primary)] p-8 text-white text-center">
        <h2 className="text-2xl font-black">Ready to Streamline Your Projects?</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Start your free 14-day trial today. No credit card required.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Start Free Trial
          </Link>
          <Link
            href="/schedule"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/10"
          >
            Schedule Call
          </Link>
        </div>
      </section>
    </main>
  );
}
