'use client';

import { motion } from 'framer-motion';
import {
  Palette,
  FileCheck,
  Wrench,
  User,
  Users,
  Briefcase,
  Gavel,
  Search,
  SlidersHorizontal,
  RotateCw,
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Ruler,
  Calculator,
  ClipboardList,
  CalendarCheck,
  Building2,
  ShieldCheck,
  DollarSign,
  Clock,
  HardHat,
  Home,
  PaintBucket,
  Hammer,
  TreePine,
  Droplets,
  Zap,
  Flame,
  Store,
  Hotel,
  Warehouse,
  Stethoscope,
  UtensilsCrossed,
  Landmark,
  MapPin,
  Layers,
  Settings,
  FileSearch,
  TrendingUp,
  CheckCircle,
  BookOpen,
  Scale,
  FileBarChart,
  MapPinned,
} from 'lucide-react';

import {
  HeroSection,
  SectionLabel,
  PlatformFlowDiagram,
  ModuleShowcaseCard,
  ComparisonSection,
  StatsBar,
  TestimonialCard,
  SplitCTA,
  NetworkProfileCard,
  ImageSection,
  PortalPreview,
  Badge,
  brand,
  heroImages,
  sectionImages,
  portalImages,
  FlowNode,
  CTASection,
  Stat,
} from '@kealee/ui';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PhaseShowcaseHeader } from '@/components/PhaseShowcaseHeader';
import { KnowledgeHub, FAQSection } from '@/components/KnowledgeHub';
import { MESSAGES } from '@/lib/messages';

interface HomePageClientProps {
  platformFlowNodes: FlowNode[];
  mockNetworkProfiles: Array<{
    businessName: string;
    ownerName?: string;
    type: string;
    trades: string[];
    rating: number;
    reviews: number;
    location: string;
    distance?: string;
    stats?: { projects?: number; responseTime?: string; onTimeRate?: string };
    badges: string[];
    availability: 'available' | 'busy' | 'unavailable';
    ctaHref: string;
  }>;
  comparisonData: {
    leftTitle: string;
    leftItems: string[];
    rightTitle: string;
    rightItems: string[];
  };
  stats: Stat[];
  homeownerTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType?: string;
  }>;
  contractorTestimonials: Array<{
    quote: string;
    name: string;
    role: string;
    rating: number;
    projectType?: string;
  }>;
  splitCTASections: CTASection[];
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export function HomePageClient({
  platformFlowNodes,
  mockNetworkProfiles,
  comparisonData,
  stats,
  homeownerTestimonials,
  contractorTestimonials,
  splitCTASections,
}: HomePageClientProps) {
  return (
    <>
      <Header />
      <main className="pt-16">
      {/* SECTION 1 - HERO (Version B: Authority — establish category) */}
      <HeroSection
        eyebrow={MESSAGES.hero.eyebrow}
        eyebrowColor="teal"
        headline={`${MESSAGES.hero.headline} ${MESSAGES.hero.headlineEm}`}
        subheadline={`${MESSAGES.hero.sub} ${MESSAGES.hero.supportingLine}`}
        ctas={[
          { label: MESSAGES.hero.primaryCta, href: '/services', variant: 'primary' },
          { label: MESSAGES.hero.secondaryCta, href: '#howitworks', variant: 'outline' },
          { label: 'Explore All Portals', href: '/portals', variant: 'ghost' },
        ]}
        trustItems={[
          'Licensed & Insured',
          '20+ Years Experience',
          'Nationwide Coverage',
          'Payment Protected',
        ]}
        backgroundImage={heroImages.newConstructionHomes.src}
        backgroundImageAlt={heroImages.newConstructionHomes.alt}
      />

      {/* SECTION 2 - PHASE SHOWCASE (Version C: Pain → Solution) */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F7FAFC]" style={{ borderTop: `4px solid ${brand.navy}` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.navy}` }}>
          <PhaseShowcaseHeader />

          <PlatformFlowDiagram nodes={platformFlowNodes} />

          <p
            className="text-center text-sm text-gray-500 mt-8 max-w-xl mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Each phase automatically inherits data from the previous phase.
            Your design specs flow into permits, permits flow into the build phase,
            and everything is tracked through closeout.
          </p>
        </div>
      </motion.section>

      {/* SECTION 3 - BUILDER NETWORK (Version D: Community — emotional close) */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ borderTop: `4px solid ${brand.teal}` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.teal}` }}>
          <div className="text-center mb-12">
            <SectionLabel text={MESSAGES.network.eyebrow.toUpperCase()} color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              {MESSAGES.network.headline}
              <br />
              <em className="italic">{MESSAGES.network.headlineEm}</em>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {MESSAGES.network.sub}
            </p>
          </div>

          {/* Three Column Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.teal}15` }}
              >
                <Users className="w-7 h-7" style={{ color: brand.teal }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                Discover Professionals
              </h3>
              <p className="text-sm text-gray-600">
                Search verified GCs, architects, engineers, and specialty contractors in the DC-Baltimore corridor.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.orange}15` }}
              >
                <Briefcase className="w-7 h-7" style={{ color: brand.orange }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                List Your Business
              </h3>
              <p className="text-sm text-gray-600">
                Create your profile, showcase your work, and get discovered by project owners and GCs.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${brand.navy}15` }}
              >
                <Gavel className="w-7 h-7" style={{ color: brand.navy }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                Bid on Projects
              </h3>
              <p className="text-sm text-gray-600">
                Access open bid invitations with fair rotation. Win projects based on merit.
              </p>
            </div>
          </div>

          {/* Network Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by trade, name, or specialty..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Filters</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge text="General Contractor" color="teal" variant="subtle" />
              <Badge text="Residential" color="gray" variant="subtle" />
              <Badge text="4+ Stars" color="gray" variant="subtle" />
              <Badge text="Available Now" color="green" variant="subtle" />
            </div>

            {/* Profile Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {mockNetworkProfiles.map((profile) => (
                <NetworkProfileCard key={profile.businessName} {...profile} />
              ))}
            </div>
          </div>

          {/* Fair Bid Rotation Callout */}
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: `${brand.teal}10` }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <RotateCw className="w-5 h-5" style={{ color: brand.teal }} />
              <span
                className="font-semibold"
                style={{ color: brand.teal, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Fair Bid Rotation
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-lg mx-auto">
              Our bid rotation system ensures all qualified contractors get equal opportunity
              to bid on projects. No pay-to-play. Just quality work.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 4 - AUDIENCES (Version A: "Build Without Blindspots.") */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ borderTop: `4px solid ${brand.orange}` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.orange}` }}>
          <div className="text-center mb-12">
            <SectionLabel text={MESSAGES.audiences.eyebrow.toUpperCase()} color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              {MESSAGES.audiences.headline}{' '}
              <em className="italic">{MESSAGES.audiences.headlineEm}</em>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {MESSAGES.audiences.sub}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModuleShowcaseCard
              icon={User}
              title="Project Owner Portal"
              subtitle="Your Command Center"
              description="Manage your project from start to finish with milestone tracking and escrow payments."
              features={[
                'Milestone Tracking',
                'Contract Management',
                'Escrow Payments',
                'Document Sharing',
              ]}
              priceAnchor={{ amount: 49, period: 'mo', showFrom: true }}
              cta={{ label: 'Start Project', href: '/owner' }}
              accentColor="navy"
            />
            <ModuleShowcaseCard
              icon={Palette}
              title="Architecture"
              subtitle="Professional Design"
              description="Licensed architects in the DC-Baltimore area for permit-ready drawings."
              features={[
                'Architectural Drawings',
                '3D Renderings',
                'Design Consultation',
                'Permit Handoff',
              ]}
              priceAnchor={{ amount: 2500, showFrom: true }}
              cta={{ label: 'Start Design', href: '/architect' }}
              accentColor="teal"
            />
            <ModuleShowcaseCard
              icon={Ruler}
              title="Engineering"
              subtitle="PE-Stamped Drawings"
              description="Structural, MEP, civil, and geotechnical engineering services."
              features={[
                'Structural Engineering',
                'MEP Design',
                'Civil Engineering',
                'Geotechnical',
              ]}
              priceAnchor={{ amount: 1500, showFrom: true }}
              cta={{ label: 'Get Engineering', href: '/engineer' }}
              accentColor="orange"
            />
            <ModuleShowcaseCard
              icon={FileCheck}
              title="Permits & Inspections"
              subtitle="AI-Powered Review"
              description="AI-powered permit review and submission for faster approvals."
              features={[
                'AI Compliance Review',
                'Auto Form Filling',
                'Status Tracking',
                'Inspection Scheduling',
              ]}
              priceAnchor={{ amount: 495, showFrom: true }}
              cta={{ label: 'Start Permit', href: '/permits' }}
              accentColor="green"
            />
          </div>
        </div>
      </motion.section>

      {/* SECTION 4.5 - PROJECTS & SERVICES */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F7FAFC]" style={{ borderTop: `4px solid #059669` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: '6px solid #059669' }}>
          <div className="text-center mb-12">
            <SectionLabel text="PROJECTS & SERVICES" color="green" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Everything You Need to Build
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From kitchen remodels to mixed-use developments — Kealee covers the full spectrum of construction projects and professional services.
            </p>
          </div>

          {/* Residential Projects */}
          <div className="mb-12">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: brand.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              <Home className="w-5 h-5" style={{ color: brand.teal }} />
              Residential Projects
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: PaintBucket, title: 'Kitchen Remodels', desc: 'Full kitchen renovations with cabinets, countertops, and appliances' },
                { icon: Droplets, title: 'Bathroom Renovations', desc: 'Complete bath remodels, tile work, fixtures, and plumbing' },
                { icon: Layers, title: 'Basement Finishing', desc: 'Transform unfinished basements into living spaces' },
                { icon: Home, title: 'Whole-Home Remodels', desc: 'Complete home transformations, structural and cosmetic' },
                { icon: Building2, title: 'Room Additions', desc: 'Expand your home with new rooms, sunrooms, or bump-outs' },
                { icon: TrendingUp, title: 'Second Stories', desc: 'Add a full second level to increase living space' },
                { icon: Landmark, title: 'ADU / In-Law Suites', desc: 'Accessory dwelling units, granny flats, and guest houses' },
                { icon: Warehouse, title: 'Garage Conversions', desc: 'Convert garages to living space, studios, or offices' },
                { icon: Hammer, title: 'Custom Home Builds', desc: 'New construction single-family homes from the ground up' },
                { icon: Building2, title: 'Townhomes & Duplexes', desc: 'Multi-unit residential new construction' },
                { icon: TreePine, title: 'Deck & Patio', desc: 'Outdoor living spaces, pergolas, and hardscaping' },
                { icon: Flame, title: 'Roofing & Exterior', desc: 'Roof replacement, siding, windows, and exterior finishes' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brand.teal}15` }}>
                      <Icon className="w-5 h-5" style={{ color: brand.teal }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commercial Projects */}
          <div className="mb-12">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: brand.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              <Store className="w-5 h-5" style={{ color: brand.orange }} />
              Commercial Projects
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Store, title: 'Tenant Improvements', desc: 'Commercial TI buildouts for office, retail, and industrial' },
                { icon: Store, title: 'Retail Buildouts', desc: 'Storefront construction, merchandising, and fit-outs' },
                { icon: Briefcase, title: 'Office Renovations', desc: 'Corporate office remodels, open-plan conversions' },
                { icon: UtensilsCrossed, title: 'Restaurant Build-Outs', desc: 'Full restaurant construction including kitchen and dining' },
                { icon: Warehouse, title: 'Warehouse / Industrial', desc: 'Industrial spaces, loading docks, and distribution centers' },
                { icon: Stethoscope, title: 'Medical & Dental', desc: 'Healthcare facility construction and exam room buildouts' },
                { icon: Hotel, title: 'Mixed-Use Development', desc: 'Residential over commercial, live-work spaces' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brand.orange}15` }}>
                      <Icon className="w-5 h-5" style={{ color: brand.orange }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Professional Services */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: brand.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              <Settings className="w-5 h-5" style={{ color: brand.navy }} />
              Professional Services
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Palette, title: 'Architectural Design', desc: 'Schematic design through construction documents (SD/DD/CD)' },
                { icon: Ruler, title: 'Structural Engineering', desc: 'PE-stamped structural analysis, design, and drawings' },
                { icon: Zap, title: 'MEP Engineering', desc: 'Mechanical, electrical, and plumbing system design' },
                { icon: FileCheck, title: 'Permit Applications', desc: 'Full permit prep, submission, and approval tracking' },
                { icon: CalendarCheck, title: 'Inspection Coordination', desc: 'Schedule, attend, and manage all building inspections' },
                { icon: MapPin, title: 'Zoning Analysis', desc: 'AI-powered zoning compliance and density analysis' },
                { icon: Calculator, title: 'Cost Estimating', desc: 'Assembly-based estimating with RSMeans cost data' },
                { icon: Gavel, title: 'Bid Management', desc: 'Fair bid rotation, contractor vetting, and bid comparison' },
                { icon: LayoutDashboard, title: 'Project Management', desc: 'Full PM with scheduling, budgeting, RFIs, and daily logs' },
                { icon: ClipboardList, title: 'Construction Admin', desc: 'Submittals, RFIs, change orders, and field management' },
                { icon: FileSearch, title: 'Document Intelligence', desc: 'AI-powered plan review, compliance checking, and analysis' },
                { icon: CheckCircle, title: 'Closeout & Warranty', desc: 'Punch lists, O&M manuals, warranty tracking, and final docs' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${brand.navy}15` }}>
                      <Icon className="w-5 h-5" style={{ color: brand.navy }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 5 - FOR CONTRACTORS & PROFESSIONALS */}
      <motion.section
        {...fadeInUp}
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#F7FAFC', borderTop: `4px solid #E8A84A` }}
      >
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: '6px solid #E8A84A' }}>
          <div className="text-center mb-12">
            <SectionLabel
              text="FOR GCs • BUILDERS • CONTRACTORS • OWNERS/RE DEVELOPERS • SPECIALTY CONTRACTORS"
              color="orange"
              className="mb-4"
            />
            <h2
              className="text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              The Complete Operations Platform
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModuleShowcaseCard
              icon={Wrench}
              title="Ops Services"
              subtitle="Outsourced Operations"
              description="Dedicated PM team for coordination, reporting, and vendor management."
              features={[
                'Dedicated PM Team',
                'Weekly Reports',
                'Vendor Coordination',
                'Admin Support',
              ]}
              priceAnchor={{ amount: 1750, period: 'mo', showFrom: true }}
              cta={{ label: 'Explore Ops', href: '/ops' }}
              accentColor="orange"
            />
            <ModuleShowcaseCard
              icon={LayoutDashboard}
              title="PM Software"
              subtitle="Self-Service Tools"
              description="Full project management suite with scheduling, budgeting, and RFIs."
              features={[
                'Scheduling',
                'Budgeting',
                'Document Management',
                'Team Collaboration',
              ]}
              priceAnchor={{ amount: 99, period: 'mo', showFrom: true }}
              cta={{ label: 'Try PM Tools', href: '/pm' }}
              accentColor="orange"
            />
            <ModuleShowcaseCard
              icon={Calculator}
              title="Estimation"
              subtitle="AI-Powered Takeoff"
              description="Assembly-based cost estimating with AI takeoff and cost databases."
              features={[
                'AI Takeoff',
                'Assembly Pricing',
                'Cost Databases',
                'Bid Reports',
              ]}
              priceAnchor={{ amount: 149, period: 'mo', showFrom: true }}
              cta={{ label: 'Try Estimation', href: '/estimation' }}
              accentColor="orange"
            />
            <ModuleShowcaseCard
              icon={DollarSign}
              title="Milestone Payments"
              subtitle="Secure Project Payments"
              description="Milestone-based payment tracking, release management, and financial reporting for all project parties."
              features={[
                'Milestone Tracking',
                'Payment Releases',
                'Financial Reports',
                'Trust Accounting',
              ]}
              priceAnchor={{ amount: 'Free', showFrom: false }}
              cta={{ label: 'Explore Payments', href: '/finance' }}
              accentColor="navy"
            />
          </div>
        </div>
      </motion.section>

      {/* SECTION 6 - HOW IT WORKS (Functional: "One Platform. Five Connected Phases.") */}
      <motion.section id="howitworks" {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ borderTop: `4px solid ${brand.navy}` }}>
        <div className="max-w-4xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.navy}` }}>
          <div className="text-center mb-12">
            <SectionLabel text={MESSAGES.howItWorks.eyebrow.toUpperCase()} color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              {MESSAGES.howItWorks.headline}{' '}
              <em className="italic">{MESSAGES.howItWorks.headlineEm}</em>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {MESSAGES.howItWorks.sub}
            </p>
          </div>

          <ComparisonSection
            leftTitle={comparisonData.leftTitle}
            leftItems={comparisonData.leftItems}
            rightTitle={comparisonData.rightTitle}
            rightItems={comparisonData.rightItems}
          />
        </div>
      </motion.section>

      {/* SECTION 6.5 - SEE WHAT YOU GET - Portal Previews */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#F7FAFC]" style={{ borderTop: `4px solid ${brand.teal}` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.teal}` }}>
          <div className="text-center mb-12">
            <SectionLabel text="SEE WHAT YOU GET" color="teal" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Powerful Tools for Every Role
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: brand.gray[600] }}>
              Each portal is purpose-built for your role in the project lifecycle.
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
              ctaHref="/owner"
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
              ctaHref="/architect"
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
              ctaHref="/engineer"
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
              ctaHref="/permits"
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
              ctaHref="/estimation"
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
              ctaHref="/ops"
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
              ctaHref="/pm"
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
              ctaHref="/finance"
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
              ctaHref="/network"
            />
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
              ctaHref="/pattern-book"
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
              ctaHref="/development-package"
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
              ctaHref="/workforce-housing"
            />
          </div>
        </div>
      </motion.section>

      {/* SECTION 6.7 - 21st Century Housing Act */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8" style={{ borderTop: `4px solid ${brand.navy}` }}>
        <div className="max-w-7xl mx-auto pl-6" style={{ borderLeft: `6px solid ${brand.navy}` }}>
          <div className="text-center mb-12">
            <SectionLabel text="21ST CENTURY HOUSING ACT" color="navy" className="mb-4" />
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              Affordable Housing Tools{' '}
              <em className="italic">Built Into the Platform</em>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Leverage the 21st Century Housing Act with AI-powered tools for zoning analysis, pre-approved designs, feasibility studies, and federal grant eligibility.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Zoning Accelerator',
                description: 'AI-powered zoning compliance, density analysis, and setback calculations for any address.',
                href: '/zoning/analyze',
                color: brand.teal,
              },
              {
                icon: BookOpen,
                title: 'Pattern Book',
                description: 'Pre-approved Sec 210 housing designs with location-adjusted costs and permit-ready plans.',
                href: '/pattern-book',
                color: brand.navy,
              },
              {
                icon: FileBarChart,
                title: 'AI Dev Package',
                description: 'Complete feasibility analysis — zoning, cost estimates, pro forma, and grant eligibility in minutes.',
                href: '/development-package',
                color: brand.orange,
              },
              {
                icon: Scale,
                title: 'Workforce Housing & Grants',
                description: 'HOME, CDBG, LIHTC eligibility checker plus FHA loan analysis and AMI income targeting.',
                href: '/workforce-housing',
                color: '#059669',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition group"
                >
                  <div
                    className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3
                    className="text-lg font-bold mb-2 group-hover:text-blue-600 transition"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </a>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* SECTION 6.75 - Built for Building */}
      <ImageSection
        title="Built for the Way Projects Actually Work"
        subtitle="Real Projects. Real Results."
        description="From custom homes to commercial build-outs, Kealee connects every phase of your project. Design flows into permits, permits flow into the build, and every stakeholder stays on the same page."
        imageSrc={sectionImages.homeRenovation.src}
        imageAlt={sectionImages.homeRenovation.alt}
        imagePosition="right"
        accentColor="orange"
      />

      {/* SECTION 7 - STATS BAR */}
      <StatsBar stats={stats} />

      {/* SECTION 8 - TESTIMONIALS */}
      <motion.section {...fadeInUp} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Homeowners */}
          <div className="mb-12">
            <SectionLabel text="HOMEOWNERS & OWNERS" color="navy" className="mb-4" />
            <div className="grid md:grid-cols-2 gap-6">
              {homeownerTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} {...testimonial} />
              ))}
            </div>
          </div>

          {/* Contractors */}
          <div>
            <SectionLabel text="CONTRACTORS & PROFESSIONALS" color="orange" className="mb-4" />
            <div className="grid md:grid-cols-2 gap-6">
              {contractorTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} {...testimonial} />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 9 - KNOWLEDGE HUB */}
      <KnowledgeHub />

      {/* SECTION 10 - FAQ */}
      <FAQSection />

      {/* SECTION 11 - FINAL CTA (Combined B+A: Authority + Urgency) */}
      <motion.section
        {...fadeInUp}
        className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F2240 0%, #1B3A6B 60%, #1F4A8A 100%)' }}
      >
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-6 text-white/40">
            {MESSAGES.finalCta.eyebrow}
          </span>
          <h2
            className="text-3xl lg:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: '"Clash Display", "Playfair Display", sans-serif' }}
          >
            {MESSAGES.finalCta.headline}
            <br />
            <em className="italic" style={{ color: '#E8A84A' }}>
              {MESSAGES.finalCta.headlineEm}
            </em>
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto font-light">
            {MESSAGES.finalCta.sub}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/services"
              className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all"
              style={{ background: '#C8882A', color: 'white' }}
            >
              Explore the Marketplace
            </a>
            <a
              href="/owner"
              className="inline-flex items-center px-8 py-4 rounded-xl text-base font-semibold transition-all border border-white/30 text-white hover:bg-white/10"
            >
              Start Your Project
            </a>
          </div>
        </div>
      </motion.section>

      {/* SECTION 12 - SPLIT CTAs */}
      <SplitCTA sections={splitCTASections} />
      </main>

      <Footer />
    </>
  );
}
