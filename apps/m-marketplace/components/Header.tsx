'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  ChevronDown,
  Palette,
  Ruler,
  Calculator,
  FileCheck,
  Wrench,
  LayoutDashboard,
  DollarSign,
  Users,
  ShoppingBag,
  User,
  Building2,
} from 'lucide-react';
import { CartButton } from './CartButton';
import { DashboardNotifications } from './DashboardNotifications';
import { useProfile } from '@kealee/auth/client';

const solutions = [
  {
    category: 'Design',
    items: [
      { name: 'Architecture', description: 'Professional design & drawings', href: '/architect', icon: Palette },
      { name: 'Engineering', description: 'Structural, MEP, civil & geotech', href: '/engineer', icon: Ruler },
    ],
  },
  {
    category: 'Build',
    items: [
      { name: 'PM Software', description: 'Project management tools', href: '/pm', icon: LayoutDashboard },
      { name: 'Ops Services', description: 'Outsourced operations team', href: '/ops', icon: Wrench },
      { name: 'Estimation', description: 'AI-powered cost estimation', href: '/estimation', icon: Calculator },
    ],
  },
  {
    category: 'Compliance',
    items: [
      { name: 'Permits & Inspections', description: 'AI permit review & tracking', href: '/permits', icon: FileCheck },
    ],
  },
  {
    category: 'Finance',
    items: [
      { name: 'Finance & Escrow', description: 'Secure payments & trust', href: '/finance', icon: DollarSign },
    ],
  },
];

const portals = [
  { name: 'Project Owner', href: '/owner', icon: User, color: 'text-blue-600' },
  { name: 'Architecture', href: '/architect', icon: Palette, color: 'text-teal-600' },
  { name: 'Engineering', href: '/engineer', icon: Ruler, color: 'text-orange-600' },
  { name: 'Permits', href: '/permits', icon: FileCheck, color: 'text-green-600' },
  { name: 'Estimation', href: '/estimation', icon: Calculator, color: 'text-amber-600' },
  { name: 'Ops Services', href: '/ops', icon: Wrench, color: 'text-sky-600' },
  { name: 'PM Dashboard', href: '/pm', icon: LayoutDashboard, color: 'text-indigo-600' },
  { name: 'Finance', href: '/finance', icon: DollarSign, color: 'text-emerald-600' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const portalsRef = useRef<HTMLDivElement>(null);
  const { profile, loading: authLoading } = useProfile();
  const isLoggedIn = !authLoading && !!profile;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
      if (portalsRef.current && !portalsRef.current.contains(event.target as Node)) {
        setPortalsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/kealee-logo-600w.png"
                alt="Kealee"
                width={300}
                height={102}
                priority
                className="h-14 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Solutions Mega Menu */}
            <div ref={solutionsRef} className="relative">
              <button
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition font-medium"
                onClick={() => { setSolutionsOpen(!solutionsOpen); setPortalsOpen(false); }}
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[640px] bg-white rounded-xl shadow-xl border border-gray-200 p-6 grid grid-cols-2 gap-6">
                  {solutions.map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        {group.category}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition group"
                            onClick={() => setSolutionsOpen(false)}
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                              <item.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <Link
                      href="/services"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      View all services →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/network" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Network
            </Link>

            <Link href="/plans" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Stock Plans
            </Link>

            <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Pricing
            </Link>

            <Link href="/faq" className="text-gray-700 hover:text-blue-600 transition font-medium">
              FAQ
            </Link>

            {/* Portals Dropdown */}
            <div ref={portalsRef} className="relative">
              <button
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition font-medium"
                onClick={() => { setPortalsOpen(!portalsOpen); setSolutionsOpen(false); }}
              >
                Portals
                <ChevronDown className={`w-4 h-4 transition-transform ${portalsOpen ? 'rotate-180' : ''}`} />
              </button>
              {portalsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Access Your Portal
                  </p>
                  <div className="space-y-1">
                    {portals.map((portal) => (
                      <Link
                        key={portal.name}
                        href={portal.href}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition"
                        onClick={() => setPortalsOpen(false)}
                      >
                        <portal.icon className={`w-5 h-5 ${portal.color}`} />
                        <span className="text-sm font-medium text-gray-900">{portal.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <Link
                      href="/portals"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition px-2"
                      onClick={() => setPortalsOpen(false)}
                    >
                      All portals →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <CartButton />

            {isLoggedIn ? (
              <>
                <DashboardNotifications />
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/account"
                  className="w-8 h-8 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-sky-200 transition"
                >
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/get-started"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 max-h-[80vh] overflow-y-auto">
            {/* Solutions Section */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Solutions</p>
              {solutions.map((group) => (
                <div key={group.category} className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 px-2 mb-1">{group.category}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1">
              <Link href="/network" className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Network
              </Link>
              <Link href="/plans" className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Stock Plans
              </Link>
              <Link href="/pricing" className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/faq" className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </Link>
              <Link href="/services" className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                All Services
              </Link>
            </div>

            {/* Portals Section */}
            <div className="border-t border-gray-100 mt-3 pt-3 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Portals</p>
              <div className="grid grid-cols-2 gap-1">
                {portals.map((portal) => (
                  <Link
                    key={portal.name}
                    href={portal.href}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <portal.icon className={`w-4 h-4 ${portal.color}`} />
                    <span className="text-sm text-gray-700">{portal.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/account"
                    className="block bg-sky-600 text-white px-6 py-2.5 rounded-lg text-center hover:bg-sky-700 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-2 py-2 text-gray-700 hover:text-blue-600 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/get-started"
                    className="block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-center hover:bg-blue-700 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
