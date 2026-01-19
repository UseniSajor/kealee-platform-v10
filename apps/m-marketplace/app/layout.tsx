import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee - Complete Construction Management Platform',
  description:
    'Professional construction management with PM services, architect tools, permit processing, and project tracking. Trusted by contractors and project owners.',
  keywords:
    'construction management, project management, architect services, permits, inspections, construction software',
  openGraph: {
    title: 'Kealee - Construction Management Platform',
    description: 'Complete construction management solution',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee - Construction Management Platform',
    description: 'Complete construction management solution',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
