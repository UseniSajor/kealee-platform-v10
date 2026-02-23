import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kealee Permits - AI-Powered Permit Applications',
  description: 'Get your permits approved 40% faster with AI-powered review. Professional permit services, inspection coordination, and zoning verification.',
};

export default function PermitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
