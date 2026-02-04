// apps/m-ops-services/app/services/[slug]/page.tsx
// Service Detail Page with Static Generation

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ServiceDetailClient } from '../../../components/ServiceDetailClient';
import {
  services,
  getAllServiceSlugs,
  getServiceBySlug,
  getRelatedServices,
  getFrequentlyOrderedWith,
} from '../../../../../packages/shared/src/data/services';

export const dynamic = 'force-static';

// Generate static params for all 18 services
export async function generateStaticParams() {
  const slugs = getAllServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Service Not Found | Kealee Ops Services',
    };
  }

  const categoryLabel = service.category === 'operations' ? 'Operations' : 'Estimation';

  return {
    title: `${service.name} | Kealee ${categoryLabel} Services`,
    description: service.description,
    openGraph: {
      title: `${service.name} - $${service.price}`,
      description: service.description,
      url: `https://ops.kealee.com/services/${service.slug}`,
      siteName: 'Kealee',
      locale: 'en_US',
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const relatedServices = getRelatedServices(slug);
  const frequentlyOrderedWith = getFrequentlyOrderedWith(slug);
  const breadcrumbCategory = service.category === 'operations' ? 'Operations' : 'Estimation';

  return (
    <ServiceDetailClient
      service={service}
      relatedServices={relatedServices}
      frequentlyOrderedWith={frequentlyOrderedWith}
      breadcrumbCategory={breadcrumbCategory}
    />
  );
}
