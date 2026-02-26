import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';

export const metadata = {
  title: 'FAQ - Kealee',
  description: 'Frequently asked questions about Kealee platform, pricing, services, and support.',
};

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
