// ============================================================
// ROOT LAYOUT
// ============================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ErrorBoundary } from '@kealee/ui';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from '@permits/src/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee Permits & Inspections',
  description: 'Permit application and inspection management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
