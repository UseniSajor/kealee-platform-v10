import Link from 'next/link'
import Image from 'next/image'

const stats = [
  { value: '500K+', label: 'Drawings in our AI database' },
  { value: '48h', label: 'Concept package delivery' },
  { value: '94%', label: 'First-submission accuracy' },
  { value: '30%', label: 'Faster than traditional firms' },
]

const testimonials = [
  {
    quote: 'Kealee delivered our concept package in under 48 hours. The quality was better than what we got from a traditional firm in 6 weeks.',
    author: 'Michael Chen',
    role: 'Project Owner, Bethesda MD',
  },
  {
    quote: 'The AI estimation tool saved us 3 days on every bid. We\'ve won 40% more contracts since joining the network.',
    author: 'Sarah Williams',
    role: 'GC, Williams Construction',
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — Social proof panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative flex-col justify-between p-10 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] bg-white/5 rounded-full" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] bg-white/5 rounded-full" />

        <div className="relative z-10">
          <Link href="/">
            <Image
              src="/kealee-logo-600w.png"
              alt="Kealee"
              width={200}
              height={68}
              className="h-14 w-auto brightness-0 invert mb-12"
            />
          </Link>

          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Build smarter.<br />
            Build faster.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-[360px]">
            AI-powered design, estimation, permits, and construction management — all in one
            platform.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mt-10">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 mt-auto pt-10">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-white/10 border border-white/15 rounded-xl p-5 backdrop-blur-sm ${
                i > 0 ? 'mt-4' : ''
              }`}
            >
              <p className="text-white/90 text-sm leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{t.author}</p>
                  <p className="text-blue-300 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Trust badges */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-1.5 text-blue-200 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              256-bit SSL
            </div>
            <div className="flex items-center gap-1.5 text-blue-200 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              SOC 2 Compliant
            </div>
            <div className="flex items-center gap-1.5 text-blue-200 text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              PCI DSS
            </div>
          </div>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
