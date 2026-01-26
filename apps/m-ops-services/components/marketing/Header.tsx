'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Building2 } from 'lucide-react';

const navigation = [
  { name: 'Pricing', href: '/pricing' },
  { name: 'How it Works', href: '/how-it-works' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'Contractors', href: '/contractors' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
          ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:shadow-xl group-hover:shadow-blue-600/40 transition-all duration-300">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900">Kealee</span>
              <span className="text-blue-600 font-semibold ml-1">Ops</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100/80 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                <Link
                  href="/login"
                  className="block px-4 py-3 text-center text-slate-600 hover:text-slate-900 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-3 text-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
