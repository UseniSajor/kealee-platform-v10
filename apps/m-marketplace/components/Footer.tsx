'use client';

import Link from 'next/link';
import { Building2, Users, Pencil, FileCheck, MapPin, Phone, Mail, ArrowRight, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

const services = [
  { name: 'Ops Services', href: '/services/ops', icon: Building2 },
  { name: 'Project Owner Portal', href: '/services/portal', icon: Users },
  { name: 'Architect Services', href: '/services/architect', icon: Pencil },
  { name: 'Permits & Inspections', href: '/services/permits', icon: FileCheck },
];

const company = [
  { name: 'About Us', href: '/about' },
  { name: 'Careers', href: '/careers' },
  { name: 'Blog', href: '/blog' },
  { name: 'Press', href: '/press' },
  { name: 'Partners', href: '/partners' },
];

const resources = [
  { name: 'Documentation', href: '/docs' },
  { name: 'Help Center', href: '/help' },
  { name: 'API Reference', href: '/api' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'Webinars', href: '/webinars' },
];

const legal = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookies' },
  { name: 'Security', href: '/security' },
];

const socials = [
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Stay Updated with Kealee
              </h3>
              <p className="text-slate-400">
                Get the latest construction industry insights and platform updates.
              </p>
            </div>
            <form className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 lg:w-80 px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                Subscribe
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">K</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">Kealee</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest -mt-1">
                  Construction Platform
                </span>
              </div>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm leading-relaxed">
              The complete construction management platform trusted by contractors,
              architects, and project owners nationwide.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <MapPin size={18} className="text-blue-500" />
                <span>Washington, DC Metro Area</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Phone size={18} className="text-blue-500" />
                <a href="tel:+18005551234">1-800-555-1234</a>
              </div>
              <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Mail size={18} className="text-blue-500" />
                <a href="mailto:hello@kealee.com">hello@kealee.com</a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                  >
                    <item.icon size={14} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-3">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Kealee Construction LLC. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
