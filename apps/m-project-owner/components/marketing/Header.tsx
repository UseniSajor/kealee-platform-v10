'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Home, ArrowRight, ChevronDown } from 'lucide-react';

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'FAQ', href: '#faq' },
];

const platformLinks = [
  { name: 'Marketplace', href: 'https://marketplace.kealee.com', description: 'Find verified contractors' },
  { name: 'Architect Hub', href: 'https://architect.kealee.com', description: 'Design & planning tools' },
  { name: 'Finance Trust', href: 'https://trust.kealee.com', description: 'Secure escrow services' },
  { name: 'Ops Services', href: 'https://ops.kealee.com', description: 'Operations management' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900">Kealee</span>
              <span className="text-xs font-medium text-slate-500 block -mt-0.5">Project Owner</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isScrolled
                    ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
              >
                {item.name}
              </a>
            ))}

            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isScrolled
                    ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
              >
                Platform
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${platformOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`absolute top-full right-0 pt-2 transition-all duration-200 ${
                  platformOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
              >
                <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="p-2">
                    {platformLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        className="flex flex-col p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-semibold text-slate-900">{link.name}</span>
                        <span className="text-sm text-slate-500">{link.description}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                isScrolled
                  ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/projects/new"
              className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Start Project
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
            mobileMenuOpen ? 'max-h-[500px] pb-6' : 'max-h-0'
          }`}
        >
          <div className="pt-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-4 py-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}

            <div className="my-4 border-t border-slate-200" />

            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Platform
            </div>
            {platformLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-4 py-3 rounded-lg hover:bg-slate-50"
              >
                <span className="font-medium text-slate-700">{link.name}</span>
                <span className="block text-sm text-slate-500">{link.description}</span>
              </a>
            ))}

            <div className="my-4 border-t border-slate-200" />

            <div className="flex flex-col gap-3 pt-2 px-4">
              <Link
                href="/login"
                className="w-full py-3 text-center font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/projects/new"
                className="w-full py-3 text-center font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Project Free
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
