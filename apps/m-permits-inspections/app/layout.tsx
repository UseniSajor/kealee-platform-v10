// apps/m-permits-inspections/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee Permits - AI-Powered Permit Applications',
  description: 'Get your permits approved 40% faster with AI-powered review. Professional permit services, inspection coordination, and zoning verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} scroll-smooth`}>
      <body>
        {children}
      </body>
    </html>
  );
}
