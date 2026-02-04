// packages/ui/src/components/marketing/MarketingSidebar.tsx
// Service catalog sidebar for marketing pages

'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Context for sidebar state
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within MarketingSidebarProvider');
  }
  return context;
};

export interface MarketingSidebarProviderProps {
  children: React.ReactNode;
}

export const MarketingSidebarProvider: React.FC<MarketingSidebarProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, activeSection, setActiveSection }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Section components
interface SectionProps {
  id: string;
  title: string;
  accentColor: 'teal' | 'green' | 'orange' | 'navy';
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const accentClasses = {
  teal: 'border-l-[#2ABFBF]',
  green: 'border-l-[#38A169]',
  orange: 'border-l-[#E8793A]',
  navy: 'border-l-[#1A2B4A]',
};

const SidebarSection: React.FC<SectionProps> = ({
  id,
  title,
  accentColor,
  children,
  defaultOpen = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div className={cn('border-l-[3px] pl-3', accentClasses[accentColor])}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <span className="text-sm font-semibold text-[#1A2B4A] group-hover:text-[#2ABFBF] transition-colors">
          {title}
        </span>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PriceItem: React.FC<{ label: string; price: string }> = ({ label, price }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-gray-600">{label}</span>
    <span className="font-mono font-semibold text-[#E8793A]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
      {price}
    </span>
  </div>
);

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center text-xs text-gray-600">
    <svg className="w-3 h-3 mr-1.5 text-[#38A169] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    {text}
  </div>
);

const CTALink: React.FC<{ href: string; text: string }> = ({ href, text }) => (
  <Link
    href={href}
    className="inline-flex items-center text-xs font-semibold text-[#2ABFBF] hover:text-[#2ABFBF]/80 transition-colors mt-2"
  >
    {text}
    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="py-3">
    {label ? (
      <div className="flex items-center">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
        <div className="flex-grow ml-2 h-px bg-gray-200" />
      </div>
    ) : (
      <div className="h-px bg-gray-200" />
    )}
  </div>
);

export interface MarketingSidebarProps {
  className?: string;
}

export const MarketingSidebar: React.FC<MarketingSidebarProps> = ({ className }) => {
  const { isOpen, setIsOpen } = useSidebar();

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center">
          <span
            className="text-2xl font-bold text-[#1A2B4A]"
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            KEALEE
          </span>
        </Link>
        <p className="text-[10px] text-gray-500 mt-1 tracking-wide">
          End-to-End Design/Build
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Platform Home */}
        <Link
          href="/"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-[#1A2B4A] hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Platform Home
        </Link>

        {/* Construction Network */}
        <div className="pt-2">
          <p className="px-3 text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Construction Network
          </p>
          <Link href="/network/find" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            Find Professionals
          </Link>
          <Link href="/network/list" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            List Your Business
          </Link>
          <Link href="/network/bids" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            View Open Bids
          </Link>
        </div>

        <Divider label="Services" />

        {/* Architecture & Design */}
        <SidebarSection id="architecture" title="Architecture & Design" accentColor="teal">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Design Packages</p>
          <PriceItem label="Essentials" price="$2,500" />
          <PriceItem label="Standard" price="$7,500" />
          <PriceItem label="Premium" price="$15,000" />
          <PriceItem label="Enterprise" price="$35,000" />
          <div className="mt-3 space-y-1">
            <FeatureItem text="Construction Drawings" />
            <FeatureItem text="3D Renderings" />
            <FeatureItem text="Consultation" />
            <FeatureItem text="Engineering" />
            <FeatureItem text="Permit Handoff" />
          </div>
          <CTALink href="/architect" text="Start Design" />
        </SidebarSection>

        {/* Permits & Inspections */}
        <SidebarSection id="permits" title="Permits & Inspections" accentColor="green">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Permit Packages</p>
          <PriceItem label="DIY" price="$495" />
          <PriceItem label="Standard" price="$1,500" />
          <PriceItem label="Premium" price="$3,500" />
          <PriceItem label="Enterprise" price="$7,500" />
          <div className="mt-3 space-y-1">
            <FeatureItem text="AI Review" />
            <FeatureItem text="Auto-Form Filling" />
            <FeatureItem text="Status Tracking" />
            <FeatureItem text="Inspection Scheduling" />
            <FeatureItem text="Corrections Support" />
          </div>
          <CTALink href="/permits" text="Start Permit" />
        </SidebarSection>

        {/* Ops & PM Services */}
        <SidebarSection id="ops" title="Ops & PM Services" accentColor="orange">
          <div className="space-y-3">
            {/* PM Software */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">PM Software (SaaS)</p>
              <div className="space-y-1">
                <FeatureItem text="Project Dashboard" />
                <FeatureItem text="Schedule Management" />
                <FeatureItem text="Document Storage" />
                <FeatureItem text="Team Communication" />
              </div>
              <div className="mt-2 space-y-1">
                <PriceItem label="Starter" price="$49/mo" />
                <PriceItem label="Pro" price="$149/mo" />
                <PriceItem label="Business" price="$299/mo" />
              </div>
            </div>

            {/* Operations Services */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Operations Services (11)</p>
              <PriceItem label="Site Visit" price="$150" />
              <PriceItem label="Progress Report" price="$200" />
              <PriceItem label="Quality Inspection" price="$350" />
              <Link href="/ops/services" className="text-[10px] text-gray-400 hover:text-[#2ABFBF]">
                + 8 more →
              </Link>
            </div>

            {/* Estimation Services */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Estimation Services (7)</p>
              <PriceItem label="Quick Estimate" price="$295" />
              <PriceItem label="Detailed Estimate" price="$795" />
              <PriceItem label="Full Takeoff" price="$1,495" />
              <Link href="/ops/estimation" className="text-[10px] text-gray-400 hover:text-[#2ABFBF]">
                + 4 more →
              </Link>
            </div>

            {/* PM Operations Add-on */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Optional Add-On</span>
              </div>
              <p className="text-xs font-semibold text-[#1A2B4A] mb-1">PM Operations (os-pm)</p>
              <p className="text-[10px] text-gray-400 italic mb-2">Remote coordination only</p>
              <PriceItem label="Basic" price="$500/mo" />
              <PriceItem label="Standard" price="$1,000/mo" />
              <PriceItem label="Premium" price="$2,000/mo" />
              <PriceItem label="Enterprise" price="$4,000/mo" />
            </div>
          </div>
          <CTALink href="/ops" text="Browse All Services" />
        </SidebarSection>

        {/* Project Owner Portal */}
        <SidebarSection id="owner" title="Project Owner Portal" accentColor="navy">
          <div className="space-y-1 mb-3">
            <FeatureItem text="Readiness Checklists" />
            <FeatureItem text="Milestone Tracking" />
            <FeatureItem text="Contracts Management" />
            <FeatureItem text="Escrow Payments" />
            <FeatureItem text="Team Coordination" />
            <FeatureItem text="Progress Updates" />
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Owner Packages</p>
          <PriceItem label="Starter" price="$49/mo" />
          <PriceItem label="Growth" price="$149/mo" />
          <PriceItem label="Professional" price="$299/mo" />
          <PriceItem label="Enterprise" price="$999/mo" />
          <div className="mt-3 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">PM Services available via os-pm</p>
            <p className="text-[10px] text-gray-400 italic">Dedicated PM (remote only)</p>
          </div>
          <CTALink href="/project-owner" text="Start Project" />
        </SidebarSection>

        <Divider />

        {/* Footer Links */}
        <div className="space-y-1 pt-2">
          <Link href="/pricing" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            Pricing Overview
          </Link>
          <Link href="/contact" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            Contact
          </Link>
          <Link href="/help" className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-[#2ABFBF] hover:bg-gray-50 rounded transition-colors">
            Help & Support
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col w-[280px] h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40',
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed left-4 top-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-[#1A2B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'lg:hidden fixed left-0 top-0 w-[280px] h-screen bg-white z-50 shadow-xl',
                className
              )}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MarketingSidebar;
