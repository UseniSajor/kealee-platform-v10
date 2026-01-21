import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { TrustedBy } from '@/components/TrustedBy';
import { Stats } from '@/components/Stats';
import { Services } from '@/components/Services';
import { HowItWorks } from '@/components/HowItWorks';
import { Benefits } from '@/components/Benefits';
import { Testimonials } from '@/components/Testimonials';
import { Pricing } from '@/components/Pricing';
import { FAQ } from '@/components/FAQ';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <TrustedBy />
      <Stats />
      <Services />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
