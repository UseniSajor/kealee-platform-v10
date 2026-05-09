import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <p className="font-display text-xl font-bold">Kealee</p>
          <p className="text-sm text-white/70">
            AI-powered construction intelligence for homeowners, builders, and sponsors across DC, Maryland, and Virginia.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/concept" className="hover:text-white">
                Concept intake
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-white">
                Catalog SKUs
              </Link>
            </li>
            <li>
              <Link href="/milestone-pay" className="hover:text-white">
                Milestone Pay
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-white">
                How it works
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Marketplace</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/marketplace" className="hover:text-white">
                Verified contractors
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Services overview
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Account</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/auth/sign-in" className="hover:text-white">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Kealee Platform LLC · Built for DMV construction workflows.
      </div>
    </footer>
  )
}
