import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="text-xl font-bold text-white">Kealee</span>
            </div>
            <p className="text-sm text-gray-400">
              The end-to-end design/build platform serving the DC-Baltimore corridor and nationwide.
            </p>
          </div>

          {/* Design & Build */}
          <div>
            <h3 className="text-white font-semibold mb-4">Design & Build</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/architect" className="hover:text-white transition">
                  Architecture
                </Link>
              </li>
              <li>
                <Link href="/engineer" className="hover:text-white transition">
                  Engineering
                </Link>
              </li>
              <li>
                <Link href="/estimation" className="hover:text-white transition">
                  Estimation
                </Link>
              </li>
              <li>
                <Link href="/permits" className="hover:text-white transition">
                  Permits & Inspections
                </Link>
              </li>
              <li>
                <Link href="/ops" className="hover:text-white transition">
                  Operations Services
                </Link>
              </li>
              <li>
                <Link href="/pm" className="hover:text-white transition">
                  PM Software
                </Link>
              </li>
              <li>
                <Link href="/finance" className="hover:text-white transition">
                  Milestone Payments
                </Link>
              </li>
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-white font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/network" className="hover:text-white transition">
                  Contractor Network
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-white transition">
                  Stock Plans
                </Link>
              </li>
              <li>
                <Link href="/design" className="hover:text-white transition">
                  Design Catalog
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/portals" className="hover:text-white transition">
                  Portal Access
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-white transition">
                  Data Deletion
                </Link>
              </li>
              <li>
                <Link href="/legal/acceptable-use" className="hover:text-white transition">
                  Acceptable Use
                </Link>
              </li>
              <li>
                <a href="https://kealee.com" className="hover:text-white transition">
                  kealee.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Kealee Platform. All rights
            reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="https://linkedin.com/company/kealee" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              LinkedIn
            </a>
            <a href="https://x.com/kealeeplatform" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              X / Twitter
            </a>
            <a href="https://facebook.com/kealee" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
