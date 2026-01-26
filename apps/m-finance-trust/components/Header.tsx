'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Shield, Wallet, FileCheck, BarChart3, Phone, ArrowRight, Lock } from 'lucide-react';

const services = [
  {
    name: 'Escrow Accounts',
    description: 'Secure fund holding for construction projects',
    href: '/escrow',
    icon: Wallet,
  },
  {
    name: 'Payment Protection',
    description: 'Milestone-based payment releases',
    href: '/payments',
    icon: Shield,
  },
  {
    name: 'Compliance & Audit',
    description: 'Full regulatory compliance tracking',
    href: '/compliance',
    icon: FileCheck,
  },
  {
    name: 'Financial Reporting',
    description: 'Real-time analytics and insights',
    href: '/reporting',
    icon: BarChart3,
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <Lock className="text-white" size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-md" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Finance Trust
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest -mt-1">
                Secure Escrow Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Services Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  scrolled ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-800 hover:text-emerald-600'
                }`}
              >
                Services
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute top-full left-0 pt-2 transition-all duration-200 ${
                  servicesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
              >
                <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
                  <div className="p-2">
                    {services.map((service) => (
                      <Link
                        key={service.name}
                        href={service.href}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                          <service.icon size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {service.name}
                          </div>
                          <div className="text-sm text-slate-500">{service.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <a
              href="#how-it-works"
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                scrolled ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-800 hover:text-emerald-600'
              }`}
            >
              How It Works
            </a>
            <a
              href="#security"
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                scrolled ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-800 hover:text-emerald-600'
              }`}
            >
              Security
            </a>
            <Link
              href="/contact"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                scrolled ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-800 hover:text-emerald-600'
              }`}
            >
              <Phone size={16} />
              Contact
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                scrolled
                  ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50'
                  : 'text-slate-800 hover:text-emerald-600'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="group relative px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-emerald-800 transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Open Account
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-[600px] pb-6' : 'max-h-0'
          }`}
        >
          <div className="pt-4 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Services
            </div>
            {services.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <service.icon size={20} />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{service.name}</div>
                  <div className="text-sm text-slate-500">{service.description}</div>
                </div>
              </Link>
            ))}

            <div className="my-4 border-t border-slate-200" />

            <a
              href="#how-it-works"
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#security"
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Security
            </a>
            <Link
              href="/contact"
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            <div className="my-4 border-t border-slate-200" />

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                className="w-full py-3 text-center font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="w-full py-3 text-center font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Open Account
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
