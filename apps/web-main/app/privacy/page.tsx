import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Kealee',
  description: 'Kealee Privacy Policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-10">Effective date: May 23, 2026 · Last updated: May 23, 2026</p>

      <section className="space-y-8 text-sm leading-7">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Who We Are</h2>
          <p>
            Kealee (&ldquo;Kealee,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a construction
            and home-improvement platform operated by Kealee Services LLC, located in the Washington DC metropolitan
            area. We operate the website <strong>kealee.com</strong> and related portals (collectively, the
            &ldquo;Platform&rdquo;).
          </p>
          <p className="mt-2">
            Contact us at: <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a>
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Information We Collect</h2>
          <p className="mb-2"><strong>Information you provide directly:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, email address, phone number, and project address submitted through intake forms</li>
            <li>Project details (type, scope, budget, timeline, photos/videos you upload)</li>
            <li>Payment information processed through Stripe (we do not store card numbers)</li>
            <li>Communications you send us via email, chat, or contact forms</li>
          </ul>
          <p className="mt-3 mb-2"><strong>Information collected automatically:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP address, browser type, device type, and operating system</li>
            <li>Pages visited, time on site, and referral source (via cookies and analytics)</li>
            <li>UTM parameters and ad click identifiers when you arrive from an advertisement</li>
          </ul>
          <p className="mt-3 mb-2"><strong>Information from third parties:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lead information from Meta (Facebook/Instagram) Lead Ads if you submit a form on our ads</li>
            <li>Public property and GIS data associated with addresses you provide</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To deliver concept packages, permit services, and other products you purchase</li>
            <li>To communicate with you about your project, orders, and account</li>
            <li>To send marketing emails about our services (you may opt out at any time)</li>
            <li>To improve our AI models, platform features, and user experience</li>
            <li>To match you with contractors and design professionals on our marketplace</li>
            <li>To comply with legal obligations and prevent fraud</li>
            <li>To measure advertising effectiveness via Meta Pixel and Google Analytics</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to remember your preferences, analyze traffic, and
            measure ad performance. These include:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Essential cookies</strong> — required for authentication and core platform functionality</li>
            <li><strong>Analytics cookies</strong> — Google Analytics 4 to understand how visitors use the Platform</li>
            <li><strong>Advertising cookies</strong> — Meta Pixel to measure conversions from Facebook/Instagram ads</li>
          </ul>
          <p className="mt-2">
            You can disable cookies in your browser settings. Some features may not function correctly if cookies
            are disabled.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. How We Share Your Information</h2>
          <p>We do not sell your personal information. We share information only in these limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Service providers</strong> — Supabase (database), Stripe (payments), Resend (email), Vercel (hosting), Replicate (AI rendering), and Sentry (error monitoring)</li>
            <li><strong>Contractors and professionals</strong> — when you request a match, we share relevant project details with vetted contractors on our marketplace</li>
            <li><strong>Legal requirements</strong> — if required by law, court order, or to protect the rights and safety of Kealee and its users</li>
            <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            services. Project data (intake forms, concept outputs, permits) is retained for a minimum of 3 years
            to support warranty claims and permit records. You may request deletion of your account and data
            at any time by emailing <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a>.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — request correction of inaccurate data</li>
            <li><strong>Deletion</strong> — request deletion of your personal data</li>
            <li><strong>Opt-out of marketing</strong> — unsubscribe from marketing emails via the link in any email or by contacting us</li>
            <li><strong>Data portability</strong> — request your data in a portable format</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a> with
            the subject &ldquo;Privacy Request.&rdquo;
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Children&apos;s Privacy</h2>
          <p>
            The Platform is not directed to children under 13. We do not knowingly collect personal information
            from children. If you believe a child has provided us personal information, please contact us and we
            will delete it promptly.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Security</h2>
          <p>
            We implement industry-standard security measures including encrypted data storage (Supabase/PostgreSQL),
            HTTPS throughout the Platform, and access controls. No method of transmission over the internet is
            100% secure; we cannot guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Meta Lead Ads</h2>
          <p>
            If you submit your information through a Kealee advertisement on Facebook or Instagram, your data
            is transmitted to us via Meta&apos;s Lead Ads API. By submitting that form, you consent to Kealee
            contacting you about your project inquiry via email or phone. You may unsubscribe at any time.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by
            posting the new policy on this page with an updated effective date. Continued use of the Platform
            after changes constitutes your acceptance of the updated policy.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">12. Contact</h2>
          <p>
            For privacy questions or requests, contact us at:<br />
            <strong>Kealee Services LLC</strong><br />
            Washington DC Metropolitan Area<br />
            <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a>
          </p>
        </div>

      </section>
    </main>
  )
}
