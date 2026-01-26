// apps/m-architect/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Architect Hub | Kealee Platform - Professional Design Project Management',
  description: 'Manage design projects, deliverables, client reviews, and team collaboration. Seamless integration with permits, engineering, and construction teams.',
  keywords: 'architect software, design project management, architectural deliverables, plan review, design collaboration, construction design',
  openGraph: {
    title: 'Kealee Architect Hub - Professional Design Project Management',
    description: 'Streamline your design workflow with integrated project management, client collaboration, and seamless handoff to permits and construction.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
