export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kealee Permits - powered by AI tools Permit Applications',
  description: 'Get your permits approved 40% faster with powered by AI tools review. Professional permit services, inspection coordination, and zoning verification.',
};

export default function PermitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
