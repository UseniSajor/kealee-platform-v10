// apps/m-marketplace/app/network/page.tsx
// Kealee Construction Network - Search & Browse

import { Metadata } from 'next';
import Image from 'next/image';
import { NetworkSearchClient } from './NetworkSearchClient';
const sectionImage = { src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80&auto=format&fit=crop', alt: 'Business professionals shaking hands' };

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Construction Network | Kealee',
  description: 'Find trusted contractors, architects, engineers, and construction professionals in the DC-Baltimore corridor. Verified, licensed, and ready to work.',
  openGraph: {
    title: 'Kealee Construction Network',
    description: 'Find the right construction professional for your project.',
    url: 'https://kealee.com/network',
  },
};

export default function NetworkPage() {
  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src={sectionImage.src}
          alt={sectionImage.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center px-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Construction Network</h1>
            <p className="text-lg text-white/85 max-w-2xl mx-auto">
              Find trusted contractors, architects, engineers, and construction professionals in the DC-Baltimore corridor.
            </p>
          </div>
        </div>
      </section>
      <NetworkSearchClient />
    </>
  );
}
