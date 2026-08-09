import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Kealee',
  description: 'Kealee Terms of Service — the rules and conditions for using the Kealee platform.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10">Effective date: May 23, 2026 · Last updated: May 23, 2026</p>

      <section className="space-y-8 text-sm leading-7">

        <div>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Kealee platform at <strong>kealee.com</strong> and its associated portals
            (collectively, the &ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform.
          </p>
          <p className="mt-2">
            These Terms constitute a binding agreement between you and <strong>Kealee Services LLC</strong>
            (&ldquo;Kealee,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Description of Services</h2>
          <p>Kealee provides:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Concept Packages</strong> — generated using AI tools design concepts, floor plan options, scope summaries, and cost estimates for home improvement projects</li>
            <li><strong>Permit Services</strong> — preparation and filing assistance for building permits in DC, Maryland, and Virginia</li>
            <li><strong>Contractor Marketplace</strong> — a platform to connect homeowners with vetted contractors and design professionals</li>
            <li><strong>Owner Portal</strong> — a dashboard to view and manage your project deliverables</li>
            <li><strong>Estimation Tools</strong> — construction cost estimation based on project scope</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. Accounts and Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Platform. By creating an account, you represent that
            all information you provide is accurate and that you have the legal authority to enter into this
            agreement. You are responsible for maintaining the security of your account credentials.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Payments and Refunds</h2>
          <p>
            All purchases are processed through Stripe. Prices are displayed in US dollars. By completing a
            purchase, you authorize Kealee to charge your payment method for the stated amount.
          </p>
          <p className="mt-2"><strong>Concept Packages:</strong> Due to the generated using AI tools and customized nature of concept
          packages, all sales are final once generation has begun. If you experience a technical failure that
          prevents delivery, contact us within 7 days for a resolution.</p>
          <p className="mt-2"><strong>Permit Services:</strong> Refunds for permit services are available before filing
          begins. Once a permit application has been submitted to a jurisdiction, fees are non-refundable.</p>
          <p className="mt-2">
            To request a refund or dispute a charge, email <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a>.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. generated using AI tools Content</h2>
          <p>
            Kealee&apos;s concept packages are created using AI technology and are intended as
            <strong> preliminary design concepts and planning tools only</strong>. They are not:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Licensed architectural or engineering drawings</li>
            <li>Construction documents approved for permit submission</li>
            <li>A substitute for consultation with a licensed architect, engineer, or contractor</li>
          </ul>
          <p className="mt-2">
            generated using AI tools cost estimates are approximations based on market data and may vary significantly from
            actual contractor bids. Kealee makes no warranty as to the accuracy of estimates.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Permit Services Disclaimer</h2>
          <p>
            Kealee assists with permit application preparation and submission but does not guarantee permit
            approval. Permit approvals are at the sole discretion of the applicable jurisdiction. Kealee is not
            a licensed architectural or engineering firm. Complex projects may require additional professional
            services beyond what Kealee provides.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Contractor Marketplace</h2>
          <p>
            Kealee does not employ contractors and is not a party to any agreement between homeowners and
            contractors. We vet contractors for licensing and insurance but do not guarantee the quality of
            their work. Disputes between homeowners and contractors must be resolved between the parties.
            Kealee&apos;s milestone payment system is a convenience feature and does not create any contractual
            obligation on Kealee&apos;s part.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. User Content</h2>
          <p>
            By uploading photos, videos, or other content to the Platform, you grant Kealee a non-exclusive,
            royalty-free license to use that content to deliver your services, improve our AI models, and
            (in anonymized or aggregated form) for marketing purposes. You represent that you own or have the
            right to upload all content you submit.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Prohibited Use</h2>
          <p>You may not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or copy our AI models or platform data</li>
            <li>Submit false or misleading project information</li>
            <li>Resell or redistribute Kealee deliverables without written permission</li>
            <li>Interfere with the security or integrity of the Platform</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Intellectual Property</h2>
          <p>
            All Platform content, software, AI models, branding, and design elements are owned by or licensed
            to Kealee. Concept packages and deliverables generated for you are licensed to you for personal
            use on the specific project for which they were created. You may not resell or publicly distribute
            generated using AI tools deliverables without our written consent.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">11. Disclaimer of Warranties</h2>
          <p>
            THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR
            THAT generated using AI tools CONTENT WILL MEET YOUR SPECIFIC REQUIREMENTS.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, KEALEE&apos;S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING
            OUT OF OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID KEALEE IN
            THE 12 MONTHS PRECEDING THE CLAIM. KEALEE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, OR CONSEQUENTIAL DAMAGES.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the District of Columbia, without regard to conflict of
            law principles. Any disputes shall be resolved in the courts of Washington DC or through binding
            arbitration at Kealee&apos;s election.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">14. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Material changes will be communicated via email or a
            prominent notice on the Platform. Continued use after changes constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">15. Contact</h2>
          <p>
            Questions about these Terms? Contact us at:<br />
            <strong>Kealee Services LLC</strong><br />
            <a href="mailto:contact@kealee.com" className="text-[#E8724B] underline">contact@kealee.com</a>
          </p>
        </div>

      </section>
    </main>
  )
}
