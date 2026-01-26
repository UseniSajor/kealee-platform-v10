'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Linkedin, Twitter } from 'lucide-react';

const footerLinks = {
  services: [
    { name: 'Project Management', href: '/services/project-management' },
    { name: 'Permit Expediting', href: '/services/permits' },
    { name: 'Contractor Coordination', href: '/services/coordination' },
    { name: 'Compliance Monitoring', href: '/services/compliance' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'Contractors', href: '/contractors' },
    { name: 'Careers', href: '/careers' },
  ],
  resources: [
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
    { name: 'Help Center', href: '/help' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl text-white">Kealee</span>
                <span className="text-blue-400 font-semibold ml-1">Ops</span>
              </div>
            </Link>
            <p className="text-slate-400 mb-6 max-w-xs">
              Operational excellence for construction businesses. Let us handle the admin while you build.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@kealee.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Mail size={18} />
                <span>support@kealee.com</span>
              </a>
              <a href="tel:+12025550123" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Phone size={18} />
                <span>(202) 555-0123</span>
              </a>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={18} />
                <span>Washington, DC</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Kealee Construction LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com/company/kealee"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
            >
              <Linkedin size={18} />
            </a>
            <a
              href="https://twitter.com/kealeeplatform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all"
            >
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
