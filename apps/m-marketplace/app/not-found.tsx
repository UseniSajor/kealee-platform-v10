import Link from 'next/link'

const quickLinks = [
  { label: 'Design Concepts', href: '/services/design', desc: 'AI-powered design from $199' },
  { label: 'Cost Estimation', href: '/services/estimation', desc: 'Know your costs before you build' },
  { label: 'Permits', href: '/services/permits', desc: 'Automated permit tracking' },
  { label: 'All Services', href: '/services', desc: 'Browse all Kealee services' },
]

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="text-7xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-gray-600 mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {link.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{link.desc}</div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
