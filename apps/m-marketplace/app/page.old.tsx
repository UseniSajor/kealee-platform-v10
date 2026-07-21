'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Home,
  Hammer,
  FileText,
  PenTool,
  Calculator,
  DollarSign,
  Users,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  Briefcase,
  Building2,
  Zap,
  Wrench,
} from 'lucide-react';

/**
 * m-marketplace - THE CENTRAL WEBAPP HUB
 *
 * This is the main dashboard for all users - the commerce engine where:
 * - Contractors/professionals provide services and get leads
 * - Homeowners find services and post projects
 * - Platform facilitates transactions, leads, and tools
 *
 * Routes users to appropriate modules based on their needs.
 */

// Icon-only sidebar navigation items
const SIDEBAR_NAV = [
  { icon: Home, label: 'Dashboard', href: '/', active: true },
  { icon: Zap, label: 'My Leads', href: '/leads', badge: '3' },
  { icon: Briefcase, label: 'My Projects', href: '/projects' },
  { icon: FileText, label: 'Post Project', href: '/post-project' },
  { icon: Users, label: 'Contractors', href: '/vendors' },
  { icon: PenTool, label: 'Design', href: '/design' },
  { icon: Shield, label: 'Permits', href: '/permits' },
  { icon: Calculator, label: 'Estimation', href: '/estimation' },
  { icon: Wrench, label: 'Operations', href: '/services' },
  { icon: DollarSign, label: 'Pricing', href: '/pricing' },
];

// Service Card Component
function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  stats
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
  href: string;
  color: string;
  stats?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'hover:border-green-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'hover:border-indigo-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'hover:border-teal-200' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Link
      href={href}
      className={`block p-5 bg-white rounded-xl border border-gray-100 ${colors.border} hover:shadow-lg transition-all duration-200 group`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <Icon className={colors.text} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" size={18} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {stats && (
            <p className="text-xs text-gray-400 mt-2">{stats}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// Quick Action Card
function QuickActionCard({
  icon: Icon,
  title,
  href,
  badge
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
        <Icon className="text-gray-600 group-hover:text-blue-600 transition-colors" size={20} />
      </div>
      <span className="font-medium text-gray-700 group-hover:text-gray-900">{title}</span>
      {badge && (
        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

// Stats Card
function StatCard({
  label,
  value,
  trend,
  trendUp
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {trend && (
        <p className={`text-xs font-medium mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  );
}

// Icon-only Sidebar Nav Item with Tooltip
function SidebarNavItem({
  icon: Icon,
  label,
  href,
  active = false,
  badge
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`
        relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <Icon size={22} />
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      {/* Tooltip */}
      <div className="
        absolute left-full ml-3 px-3 py-1.5
        bg-gray-900 text-white text-sm font-medium
        rounded-lg whitespace-nowrap
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200
        z-50
      ">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    </Link>
  );
}

export default function MarketplaceDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo & Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Kealee</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search services, contractors, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>
            <Link
              href="/login"
              className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Icon-Only Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col items-center w-20 bg-white border-r border-gray-200 py-6 sticky top-[65px] h-[calc(100vh-65px)]">
          <nav className="flex flex-col items-center gap-2 flex-1">
            {SIDEBAR_NAV.map((item) => (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={item.active}
                badge={item.badge}
              />
            ))}
          </nav>

          {/* Bottom user avatar */}
          <div className="mt-auto pt-4 border-t border-gray-100 w-full flex justify-center">
            <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors">
              <span className="text-sm font-semibold">JD</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
              <span className="text-xl font-bold text-gray-900">Kealee</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {SIDEBAR_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${item.active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Kealee</h1>
            <p className="text-gray-600 mt-1">Your construction services marketplace</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Active Leads" value="127" trend="12% this week" trendUp={true} />
            <StatCard label="Contractors Online" value="48" />
            <StatCard label="Projects Posted" value="23" trend="5 today" trendUp={true} />
            <StatCard label="Avg Response Time" value="2.4h" trend="15% faster" trendUp={true} />
          </div>

          {/* I Am Looking For... */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What are you looking for?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ServiceCard
                icon={Home}
                title="I'm a Homeowner"
                description="Post your project and get matched with vetted contractors"
                href="/post-project"
                color="blue"
                stats="1,200+ projects completed"
              />
              <ServiceCard
                icon={Hammer}
                title="I'm a Contractor"
                description="Find leads, bid on projects, grow your business"
                href="/leads"
                color="green"
                stats="450+ active contractors"
              />
              <ServiceCard
                icon={PenTool}
                title="I Need Design"
                description="Connect with licensed architects and designers"
                href="/design"
                color="purple"
                stats="Starts at $495"
              />
              <ServiceCard
                icon={FileText}
                title="I Need Permits"
                description="AI-powered permit review and submission services"
                href="/permits"
                color="orange"
                stats="95% approval rate"
              />
              <ServiceCard
                icon={Calculator}
                title="I Need Estimation"
                description="Get accurate cost estimates for your project"
                href="/estimation"
                color="indigo"
                stats="Free initial estimate"
              />
              <ServiceCard
                icon={DollarSign}
                title="Project Management"
                description="Managed PM services or self-service tools"
                href="/pricing"
                color="teal"
                stats="Save 40% on PM costs"
              />
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickActionCard icon={FileText} title="Post a New Project" href="/post-project" />
                <QuickActionCard icon={Users} title="Browse Contractors" href="/vendors" />
                <QuickActionCard icon={Zap} title="View Available Leads" href="/leads" badge="3 New" />
                <QuickActionCard icon={Calculator} title="Get Cost Estimate" href="/estimation" />
                <QuickActionCard icon={Shield} title="Start Permit Application" href="/permits" />
                <QuickActionCard icon={PenTool} title="Request Design Consult" href="/design" />
              </div>
            </div>

            {/* Featured / Platform Stats */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Highlights</h2>
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Verified Contractors</p>
                    <p className="text-sm text-gray-500">All contractors are licensed & insured</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Shield className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Secure Payments</p>
                    <p className="text-sm text-gray-500">Funds released when work is approved</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Fair Bidding</p>
                    <p className="text-sm text-gray-500">Rotation system ensures equal opportunities</p>
                  </div>
                </div>
                <hr className="my-4" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">$12.4M</p>
                  <p className="text-sm text-gray-500">Projects completed this year</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity / Featured Listings */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Project Requests</h2>
              <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
              {[
                { title: 'Kitchen Remodel', location: 'Bethesda, MD', budget: '$35K-$50K', posted: '2 hours ago', bids: 3 },
                { title: 'Bathroom Renovation', location: 'Arlington, VA', budget: '$15K-$25K', posted: '4 hours ago', bids: 5 },
                { title: 'Deck Construction', location: 'Potomac, MD', budget: '$20K-$30K', posted: '6 hours ago', bids: 2 },
              ].map((project, i) => (
                <Link
                  key={i}
                  href={`/leads/${i + 1}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Hammer className="text-gray-500" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.title}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {project.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} /> {project.budget}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{project.bids} bids</p>
                    <p className="text-xs text-gray-500">{project.posted}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
