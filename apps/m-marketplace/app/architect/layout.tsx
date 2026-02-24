export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Kealee - Architectural Design Services',
  description: 'Get professional architectural design quotes in 24 hours',
};

export default function ArchitectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
