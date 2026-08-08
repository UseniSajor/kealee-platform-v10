// apps/m-permits-inspections/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee Permits - powered by AI tools Permit Applications',
  description: 'Get your permits approved 40% faster with powered by AI tools review. Professional permit services, inspection coordination, and zoning verification.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.className} scroll-smooth`}>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
