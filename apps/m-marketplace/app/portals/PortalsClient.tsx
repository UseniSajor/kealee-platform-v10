'use client';

import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Palette,
  ClipboardList,
  Ruler,
  Building2,
  HardHat,
  FileCheck,
  CalendarCheck,
  Calculator,
  DollarSign,
  Users,
  Clock,
  Search,
  ShieldCheck,
  Gavel,
  BookOpen,
  Home,
  Scale,
  FileBarChart,
  MapPinned,
  MapPin,
  CheckCircle,
  Wrench,
} from 'lucide-react';
import {
  PortalPreview,
  SectionLabel,
  brand,
  portalImages,
} from '@kealee/ui';

const heroImage = { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80&auto=format&fit=crop', alt: 'Modern glass and steel building facade' };

export function PortalsClient() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            See What You Get
          </h1>
          <p className="text-xl text-white/85 max-w-3xl mx-auto mb-8">
            Each portal is purpose-built for your role in the project lifecycle. Preview the dashboards below and get started free.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Portal Previews */}
      <section className="py-16 bg-[#F7FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel text="PORTALS" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Powerful Tools for Every Role
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: brand.gray[600] }}>
              Preview the dashboard experience for each portal. Sign up to unlock your tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PortalPreview
              portalName="Project Owner Portal"
              portalUrl="kealee.com/owner"
              description="Your command center for tracking every milestone, payment, and document in your project."
              heroImage={portalImages.projectOwner.src}
              heroImageAlt={portalImages.projectOwner.alt}
              accentColor="navy"
              sidebarItems={[
                { icon: LayoutDashboard, label: 'Dashboard' },
                { icon: FolderOpen, label: 'Projects' },
                { icon: FileText, label: 'Documents' },
                { icon: BarChart3, label: 'Reports' },
              ]}
              stats={[
                { label: 'Active Projects', value: '3' },
                { label: 'Next Milestone', value: 'Day 45' },
                { label: 'Budget Used', value: '62%' },
              ]}
              features={[
                'Real-time milestone tracking',
                'Escrow payment management',
                'Document sharing & approvals',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Architect Portal"
              portalUrl="kealee.com/architect"
              description="Portfolio management, plan uploads, and seamless handoff to permitting — all in one place."
              heroImage={portalImages.architect.src}
              heroImageAlt={portalImages.architect.alt}
              accentColor="teal"
              sidebarItems={[
                { icon: LayoutDashboard, label: 'Dashboard' },
                { icon: Palette, label: 'Portfolio' },
                { icon: FileText, label: 'Plans' },
                { icon: ClipboardList, label: 'Reviews' },
              ]}
              stats={[
                { label: 'Active Designs', value: '7' },
                { label: 'Plans Uploaded', value: '24' },
                { label: 'Permit Ready', value: '5' },
              ]}
              features={[
                'Plan upload & version control',
                'Client review & approval workflow',
                'Direct permit submission handoff',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Engineering Portal"
              portalUrl="kealee.com/engineer"
              description="Structural, MEP, civil, and geotechnical engineering with PE-stamped drawings."
              heroImage={portalImages.engineer.src}
              heroImageAlt={portalImages.engineer.alt}
              accentColor="orange"
              sidebarItems={[
                { icon: Ruler, label: 'Projects' },
                { icon: Building2, label: 'Structural' },
                { icon: HardHat, label: 'MEP' },
                { icon: FileText, label: 'Drawings' },
              ]}
              stats={[
                { label: 'Active Projects', value: '12' },
                { label: 'PE Stamps', value: '34' },
                { label: 'Disciplines', value: '4' },
              ]}
              features={[
                'Structural analysis & design',
                'MEP coordination drawings',
                'PE-stamped deliverables',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Permits Portal"
              portalUrl="kealee.com/permits"
              description="AI-powered permit review, auto form-filling, and real-time status tracking across 3,000+ jurisdictions."
              heroImage={portalImages.permits.src}
              heroImageAlt={portalImages.permits.alt}
              accentColor="green"
              sidebarItems={[
                { icon: LayoutDashboard, label: 'Dashboard' },
                { icon: FileCheck, label: 'Permits' },
                { icon: CalendarCheck, label: 'Inspections' },
                { icon: Building2, label: 'Jurisdictions' },
              ]}
              stats={[
                { label: 'Pending Permits', value: '12' },
                { label: 'Approved', value: '48' },
                { label: 'Avg. Turnaround', value: '8 days' },
              ]}
              features={[
                'AI compliance pre-review',
                'Auto form filling from plans',
                'Inspection scheduling & tracking',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Estimation Tool"
              portalUrl="kealee.com/estimation"
              description="Build accurate estimates with assembly-based takeoffs, cost databases, and professional reports."
              heroImage={portalImages.estimation.src}
              heroImageAlt={portalImages.estimation.alt}
              accentColor="orange"
              sidebarItems={[
                { icon: Calculator, label: 'Estimates' },
                { icon: Ruler, label: 'Takeoff' },
                { icon: DollarSign, label: 'Cost DB' },
                { icon: BarChart3, label: 'Reports' },
              ]}
              stats={[
                { label: 'Estimates', value: '156' },
                { label: 'Assemblies', value: '89' },
                { label: 'Avg. Accuracy', value: '96%' },
              ]}
              features={[
                'Assembly-based cost estimating',
                'RSMeans cost database integration',
                'Professional PDF report generation',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Ops Services"
              portalUrl="kealee.com/ops"
              description="Your dedicated operations team handles permits, reporting, vendor coordination, and admin work."
              heroImage={portalImages.opsServices.src}
              heroImageAlt={portalImages.opsServices.alt}
              accentColor="orange"
              sidebarItems={[
                { icon: ClipboardList, label: 'Tasks' },
                { icon: Users, label: 'Vendors' },
                { icon: FileText, label: 'Reports' },
                { icon: Clock, label: 'Timeline' },
              ]}
              stats={[
                { label: 'Hours Saved/Week', value: '22' },
                { label: 'Active Tasks', value: '34' },
                { label: 'On-Time Rate', value: '98%' },
              ]}
              features={[
                'Dedicated PM coordination team',
                'Weekly progress reporting',
                'Vendor & sub management',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="PM Software"
              portalUrl="kealee.com/pm"
              description="Full-featured project management for GCs, builders, and contractors. Scheduling, budgeting, RFIs, daily logs, and more."
              heroImage={portalImages.pmSoftware.src}
              heroImageAlt={portalImages.pmSoftware.alt}
              accentColor="orange"
              sidebarItems={[
                { icon: LayoutDashboard, label: 'Dashboard' },
                { icon: CalendarCheck, label: 'Schedule' },
                { icon: DollarSign, label: 'Budget' },
                { icon: ClipboardList, label: 'Daily Logs' },
              ]}
              stats={[
                { label: 'Active Projects', value: '18' },
                { label: 'Tasks Complete', value: '847' },
                { label: 'On Budget', value: '94%' },
              ]}
              features={[
                'Scheduling & Gantt charts',
                'Budget tracking & change orders',
                'RFIs, submittals & punch lists',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Milestone Payments"
              portalUrl="kealee.com/finance"
              description="Milestone-based payment tracking, release management, and financial reporting for all project parties."
              heroImage={portalImages.financeTrust.src}
              heroImageAlt={portalImages.financeTrust.alt}
              accentColor="navy"
              sidebarItems={[
                { icon: DollarSign, label: 'Payments' },
                { icon: FileText, label: 'Statements' },
                { icon: BarChart3, label: 'Reports' },
                { icon: ShieldCheck, label: 'Trust' },
              ]}
              stats={[
                { label: 'Escrow Accounts', value: '47' },
                { label: 'Releases', value: '312' },
                { label: 'Protected', value: '$8.2M' },
              ]}
              features={[
                'Secure escrow management',
                'Milestone-based payments',
                'Full transaction history',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Contractor Network"
              portalUrl="kealee.com/network"
              description="Find verified contractors, compare bids, and connect with professionals in the DC-Baltimore corridor."
              heroImage={portalImages.marketplace.src}
              heroImageAlt={portalImages.marketplace.alt}
              accentColor="teal"
              sidebarItems={[
                { icon: Search, label: 'Search' },
                { icon: Users, label: 'Network' },
                { icon: ShieldCheck, label: 'Verified' },
                { icon: Gavel, label: 'Bids' },
              ]}
              stats={[
                { label: 'Professionals', value: '500+' },
                { label: 'Jurisdictions', value: '3,000+' },
                { label: 'Projects Posted', value: '1,200+' },
              ]}
              features={[
                'Verified contractor profiles',
                'Fair bid rotation system',
                'Trade-specific search & filtering',
              ]}
              ctaHref="/get-started"
            />
          </div>
        </div>
      </section>

      {/* Housing Act Tools */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel text="21ST CENTURY HOUSING ACT" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Housing Act Tools
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: brand.gray[600] }}>
              AI-powered tools for affordable housing development, grant eligibility, and zoning analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <PortalPreview
              portalName="Pattern Book"
              portalUrl="kealee.com/pattern-book"
              description="Pre-approved housing designs from the 21st Century Housing Act — permit-ready plans with location-adjusted costs."
              heroImage={portalImages.patternBook.src}
              heroImageAlt={portalImages.patternBook.alt}
              accentColor="navy"
              sidebarItems={[
                { icon: BookOpen, label: 'Designs' },
                { icon: Home, label: 'Types' },
                { icon: FileCheck, label: 'Pre-Approved' },
                { icon: DollarSign, label: 'Costs' },
              ]}
              stats={[
                { label: 'Designs', value: '24+' },
                { label: 'Types', value: '8' },
                { label: 'Pre-Approved', value: '18' },
              ]}
              features={[
                'Sec 210 pre-approved plans',
                'Location-adjusted costs',
                'Permit-ready designs',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Dev Package Generator"
              portalUrl="kealee.com/development-package"
              description="AI-powered feasibility analysis for any address — zoning, costs, pro forma, and grant eligibility in minutes."
              heroImage={portalImages.devPackage.src}
              heroImageAlt={portalImages.devPackage.alt}
              accentColor="teal"
              sidebarItems={[
                { icon: FileBarChart, label: 'Analysis' },
                { icon: MapPinned, label: 'Zoning' },
                { icon: DollarSign, label: 'Pro Forma' },
                { icon: CheckCircle, label: 'Grants' },
              ]}
              stats={[
                { label: 'Analyses', value: '8' },
                { label: 'Time', value: '<5 min' },
                { label: 'Score', value: '0-100' },
              ]}
              features={[
                'Zoning + compliance check',
                'Cost + pro forma analysis',
                'Grant eligibility check',
              ]}
              ctaHref="/get-started"
            />
            <PortalPreview
              portalName="Workforce Housing"
              portalUrl="kealee.com/workforce-housing"
              description="Federal grants and financing programs — HOME, CDBG, LIHTC eligibility, FHA loan analysis, and AMI income targeting."
              heroImage={portalImages.workforceHousing.src}
              heroImageAlt={portalImages.workforceHousing.alt}
              accentColor="green"
              sidebarItems={[
                { icon: Scale, label: 'Programs' },
                { icon: DollarSign, label: 'Grants' },
                { icon: Home, label: 'Financing' },
                { icon: CheckCircle, label: 'Eligibility' },
              ]}
              stats={[
                { label: 'Programs', value: '12+' },
                { label: 'Grants', value: '4' },
                { label: 'Financing', value: '5' },
              ]}
              features={[
                'HOME/CDBG/LIHTC eligibility',
                'FHA loan analysis',
                'AMI income targeting',
              ]}
              ctaHref="/get-started"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="/zoning/analyze"
              className="bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition group flex items-start gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${brand.teal}15` }}
              >
                <MapPin className="w-6 h-6" style={{ color: brand.teal }} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold mb-1 group-hover:text-blue-600 transition"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                >
                  Zoning Accelerator
                </h3>
                <p className="text-sm text-gray-600">AI-powered zoning compliance, density analysis, and setback calculations for any address.</p>
              </div>
            </a>
            <a
              href="/finance/hud/eligibility"
              className="bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition group flex items-start gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${brand.navy}15` }}
              >
                <Scale className="w-6 h-6" style={{ color: brand.navy }} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold mb-1 group-hover:text-blue-600 transition"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                >
                  HUD Eligibility Checker
                </h3>
                <p className="text-sm text-gray-600">Check eligibility for FHA, HOME, CDBG, and other HUD programs based on your project details.</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section
        className="py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #0F2240 0%, #1B3A6B 60%, #1F4A8A 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2
            className="text-3xl lg:text-4xl font-bold text-white mb-6"
            style={{ fontFamily: '"Clash Display", sans-serif' }}
          >
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
            Create your free account and access the tools you need to manage your construction project from start to finish.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/get-started"
              className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all"
              style={{ background: '#C8882A', color: 'white' }}
            >
              Sign Up Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all border border-white/30 text-white hover:bg-white/10"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-8">
            Not sure which portal to use? Contact our team and we will point you in the right direction.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">Contact Support</Link>
            <a href="mailto:support@kealee.com" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold transition-colors">Email support@kealee.com</a>
          </div>
        </div>
      </section>
    </div>
  )
}
