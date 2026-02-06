'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  Briefcase,
  Gavel,
  Palette,
  FileCheck,
  Wrench,
  User,
  DollarSign,
  HelpCircle,
  Mail,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { brand, appAccents } from './brand';
import { PriceDisplay } from './PriceDisplay';

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SidebarSection({
  title,
  icon,
  accentColor,
  isActive,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7FAFC] transition-colors"
        style={{ borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent' }}
      >
        <span style={{ color: isActive ? accentColor : brand.gray[500] }}>{icon}</span>
        <span
          className="flex-1 font-medium text-sm"
          style={{
            color: isActive ? brand.navy : brand.gray[700],
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          {title}
        </span>
        <motion.span
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: brand.gray[400] }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 bg-[#FAFBFC]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-xs text-gray-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PriceTier({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-600">{name}</span>
      <span className="font-mono font-semibold text-gray-800">{price}</span>
    </div>
  );
}

function CTALink({ href, children, color }: { href: string; children: React.ReactNode; color: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:underline"
      style={{ color }}
    >
      {children}
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

export interface MarketingSidebarProps {
  activeSection?: string;
  className?: string;
}

export function MarketingSidebar({ activeSection, className = '' }: MarketingSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>([activeSection || 'architect']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo & Tagline */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: brand.navy, fontFamily: '"Clash Display", sans-serif' }}
          >
            K
          </div>
          <div>
            <div
              className="font-bold text-lg leading-tight"
              style={{ color: brand.navy, fontFamily: '"Clash Display", sans-serif' }}
            >
              KEALEE
            </div>
            <div className="text-[10px] text-gray-500 -mt-0.5">End-to-End Design/Build</div>
          </div>
        </Link>
      </div>

      {/* Platform Home */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-3 hover:bg-[#F7FAFC] transition-colors border-b border-gray-100"
      >
        <Home className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Platform Home</span>
      </Link>

      {/* Construction Network */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Construction Network
        </div>
        <div className="space-y-1">
          <Link href="/network/find" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-1">
            <Users className="w-4 h-4" />
            <span>Find Professionals</span>
          </Link>
          <Link href="/network/list" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-1">
            <Briefcase className="w-4 h-4" />
            <span>List Your Business</span>
          </Link>
          <Link href="/network/bids" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-1">
            <Gavel className="w-4 h-4" />
            <span>View Open Bids</span>
          </Link>
        </div>
      </div>

      {/* Services Divider */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Services
        </span>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Architecture & Design */}
        <SidebarSection
          title="Architecture & Design"
          icon={<Palette className="w-4 h-4" />}
          accentColor={appAccents.architect}
          isActive={openSections.includes('architect')}
          onToggle={() => toggleSection('architect')}
        >
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Design Packages</div>
              <div className="space-y-1">
                <PriceTier name="Essentials" price="$2,500" />
                <PriceTier name="Standard" price="$7,500" />
                <PriceTier name="Premium" price="$15,000" />
                <PriceTier name="Enterprise" price="$35,000" />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Features</div>
              <FeatureList
                items={[
                  'Construction Drawings',
                  '3D Renderings',
                  'Design Consultation',
                  'Engineering Coordination',
                  'Permit Handoff',
                ]}
              />
            </div>
            <CTALink href="/architect" color={appAccents.architect}>
              Start Design
            </CTALink>
          </div>
        </SidebarSection>

        {/* Permits & Inspections */}
        <SidebarSection
          title="Permits & Inspections"
          icon={<FileCheck className="w-4 h-4" />}
          accentColor={appAccents.permits}
          isActive={openSections.includes('permits')}
          onToggle={() => toggleSection('permits')}
        >
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Packages</div>
              <div className="space-y-1">
                <PriceTier name="DIY" price="$495" />
                <PriceTier name="Standard" price="$1,500" />
                <PriceTier name="Premium" price="$3,500" />
                <PriceTier name="Enterprise" price="$7,500" />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Features</div>
              <FeatureList
                items={[
                  'AI Compliance Review',
                  'Auto Form Filling',
                  'Real-Time Status Tracking',
                  'Inspection Scheduling',
                  'Corrections Management',
                ]}
              />
            </div>
            <CTALink href="/permits" color={appAccents.permits}>
              Start Permit
            </CTALink>
          </div>
        </SidebarSection>

        {/* Ops & PM Services */}
        <SidebarSection
          title="Ops & PM Services"
          icon={<Wrench className="w-4 h-4" />}
          accentColor={appAccents.ops}
          isActive={openSections.includes('ops')}
          onToggle={() => toggleSection('ops')}
        >
          <div className="space-y-3">
            {/* PM Software */}
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">PM Software (SaaS)</div>
              <div className="space-y-1">
                <PriceTier name="Starter" price="$99/mo" />
                <PriceTier name="Professional" price="$299/mo" />
                <PriceTier name="Business" price="$599/mo" />
                <PriceTier name="Enterprise" price="Custom" />
              </div>
            </div>

            {/* Operations Services */}
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Operations (11)</div>
              <div className="space-y-1">
                <PriceTier name="Site Assessment" price="$350" />
                <PriceTier name="Subcontractor Mgmt" price="$750" />
                <PriceTier name="Quality Control" price="$500" />
              </div>
              <Link href="/ops/services" className="text-[10px] text-orange-600 hover:underline mt-1 inline-block">
                + 8 more services
              </Link>
            </div>

            {/* Estimation Services */}
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Estimation (7)</div>
              <div className="space-y-1">
                <PriceTier name="Quick Estimate" price="$199" />
                <PriceTier name="Detailed Estimate" price="$499" />
                <PriceTier name="Full Takeoff" price="$999" />
              </div>
              <Link href="/ops/estimation" className="text-[10px] text-orange-600 hover:underline mt-1 inline-block">
                + 4 more services
              </Link>
            </div>

            {/* PM Operations Add-on */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Optional Add-On</div>
              <div className="bg-orange-50 rounded-md p-2">
                <div className="text-xs font-semibold text-gray-800">PM Operations (os-pm)</div>
                <div className="text-[10px] text-gray-500 italic mb-2">Remote coordination only</div>
                <div className="space-y-1">
                  <PriceTier name="Package A" price="$1,750/mo" />
                  <PriceTier name="Package B" price="$4,500/mo" />
                  <PriceTier name="Package C" price="$9,500/mo" />
                  <PriceTier name="Package D" price="$16,500/mo" />
                </div>
              </div>
            </div>

            <CTALink href="/ops" color={appAccents.ops}>
              Browse All Services
            </CTALink>
          </div>
        </SidebarSection>

        {/* Project Owner Portal */}
        <SidebarSection
          title="Project Owner Portal"
          icon={<User className="w-4 h-4" />}
          accentColor={appAccents.projectOwner}
          isActive={openSections.includes('owner')}
          onToggle={() => toggleSection('owner')}
        >
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Features</div>
              <FeatureList
                items={[
                  'Readiness Checklists',
                  'Milestone Tracking',
                  'Contract Management',
                  'Escrow Payments',
                  'Team Collaboration',
                  'Progress Photos',
                ]}
              />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-400 mb-2">Owner Packages</div>
              <div className="space-y-1">
                <PriceTier name="Starter" price="$49/mo" />
                <PriceTier name="Growth" price="$149/mo" />
                <PriceTier name="Professional" price="$299/mo" />
                <PriceTier name="Enterprise" price="$999/mo" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-md p-2">
              <div className="text-[10px] text-gray-500">Need a Dedicated PM?</div>
              <div className="text-xs text-gray-700">Add PM Services via os-pm (remote only)</div>
            </div>
            <CTALink href="/project-owner" color={appAccents.projectOwner}>
              Start Project
            </CTALink>
          </div>
        </SidebarSection>
      </div>

      {/* Footer Links */}
      <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <Link href="/pricing" className="hover:text-gray-700 flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Pricing Overview
          </Link>
          <Link href="/contact" className="hover:text-gray-700 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Contact
          </Link>
          <Link href="/help" className="hover:text-gray-700 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Help & Support
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-[280px] h-screen sticky top-0 border-r border-gray-200 ${className}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
