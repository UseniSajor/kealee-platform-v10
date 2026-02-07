import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"
import { Separator } from "@/components/ui"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="font-bold text-xl text-white mb-4">
              Kealee <span className="text-orange-600">Development</span>
            </div>
            <p className="text-sm text-gray-400">
              Owner's Representative & Development Advisory for real estate projects nationwide. Licensed design and legal counsel coordination when required.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              <a href="tel:+13015758777" className="hover:text-orange-600 transition-colors">
                (301) 575-8777
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/development" className="text-sm hover:text-orange-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/development/services" className="text-sm hover:text-orange-600 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/development/how-it-works" className="text-sm hover:text-orange-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/development/experience" className="text-sm hover:text-orange-600 transition-colors">
                  Experience
                </Link>
              </li>
              <li>
                <Link href="/development/contact" className="text-sm hover:text-orange-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>Feasibility & Pre-Development</li>
              <li>Owner's Rep Services</li>
              <li>Development Management</li>
              <li>Strategic Partnership</li>
              <li>Construction Oversight</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                <a href="mailto:getstarted@kealee.com" className="hover:text-orange-600 transition-colors">
                  getstarted@kealee.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
                <span>Nationwide</span>
              </li>
              <li className="pt-2">
                <a
                  href="/kealee-development-1pager.pdf"
                  download
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Download 1-Pager
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {currentYear} Kealee Development. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-orange-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-orange-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
