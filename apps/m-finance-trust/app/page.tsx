import {
  Header,
  Hero,
  TrustIndicators,
  Stats,
  EscrowProcess,
  Services,
  SecurityFeatures,
  Testimonials,
  FAQ,
  CTA,
  Footer,
} from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <TrustIndicators />
      <Stats />
      <EscrowProcess />
      <Services />
      <SecurityFeatures />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
