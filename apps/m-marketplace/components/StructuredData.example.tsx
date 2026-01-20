/**
 * StructuredData Component Usage Examples
 * 
 * This file shows how to use the StructuredData component in different scenarios
 */

import StructuredData from '@/components/StructuredData';
import type { Service, Contractor, Review, FaqItem, BreadcrumbItem } from '@/components/StructuredData';

// ============================================
// Example 1: Contractor Page with Schema
// ============================================

export default function ContractorPage({ contractorId }: { contractorId: string }) {
  const contractor: Contractor = {
    name: 'ABC Construction Company',
    description: 'Professional construction services for residential and commercial projects',
    url: `https://marketplace.kealee.com/contractors/${contractorId}`,
    image: 'https://marketplace.kealee.com/contractors/abc-construction.jpg',
    telephone: '+1-555-123-4567',
    address: {
      streetAddress: '123 Main Street',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94107',
      addressCountry: 'US'
    },
    geo: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    priceRange: '$$',
    serviceArea: ['San Francisco', 'Oakland', 'Berkeley'],
    services: ['General Contracting', 'Kitchen Remodeling', 'Bathroom Renovation'],
    aggregateRating: {
      ratingValue: 4.5,
      ratingCount: 127,
      bestRating: 5,
      worstRating: 1
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', item: 'https://marketplace.kealee.com' },
    { name: 'Contractors', item: 'https://marketplace.kealee.com/contractors' },
    { name: contractor.name, item: contractor.url }
  ];

  return (
    <>
      <StructuredData type="contractor" data={contractor} />
      <StructuredData type="breadcrumb" data={breadcrumbs} />
      
      <div>
        <h1>{contractor.name}</h1>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 2: Service Page
// ============================================

export function ServicePage() {
  const service: Service = {
    name: 'Kitchen Remodeling',
    description: 'Complete kitchen renovation services including design, installation, and finishing',
    areaServed: 'San Francisco Bay Area',
    provider: {
      name: 'Kealee Marketplace',
      url: 'https://marketplace.kealee.com'
    }
  };

  return (
    <>
      <StructuredData type="service" data={service} />
      <div>
        <h1>{service.name}</h1>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 3: Review Page
// ============================================

export function ReviewPage() {
  const review: Review = {
    author: 'John Doe',
    datePublished: '2024-01-15',
    reviewBody: 'Excellent work! The contractor was professional, on time, and delivered high-quality results.',
    reviewRating: {
      ratingValue: 5,
      bestRating: 5,
      worstRating: 1
    }
  };

  return (
    <>
      <StructuredData type="review" data={review} />
      <div>
        <h2>Review by {review.author}</h2>
        {/* Your review content */}
      </div>
    </>
  );
}

// ============================================
// Example 4: FAQ Page
// ============================================

export function FaqPage() {
  const faqs: FaqItem[] = [
    {
      question: 'How do I find a contractor?',
      answer: 'Browse our directory of verified contractors, read reviews, and request quotes for your project.'
    },
    {
      question: 'Are contractors verified?',
      answer: 'Yes, all contractors undergo background checks, license verification, and insurance validation.'
    },
    {
      question: 'How much does it cost?',
      answer: 'Posting projects and receiving quotes is free for homeowners. Contractors pay subscription fees.'
    }
  ];

  return (
    <>
      <StructuredData type="faq" data={faqs} />
      <div>
        <h1>Frequently Asked Questions</h1>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================
// Example 5: Multiple Structured Data Types
// ============================================

export function ContractorDetailPage({ contractorId }: { contractorId: string }) {
  const contractor: Contractor = {
    name: 'XYZ Builders',
    description: 'Licensed general contractor specializing in residential construction',
    url: `https://marketplace.kealee.com/contractors/${contractorId}`,
    image: 'https://marketplace.kealee.com/contractors/xyz-builders.jpg',
    telephone: '+1-555-987-6543',
    address: {
      streetAddress: '456 Oak Avenue',
      addressLocality: 'Oakland',
      addressRegion: 'CA',
      postalCode: '94601',
      addressCountry: 'US'
    },
    geo: {
      latitude: 37.8044,
      longitude: -122.2711
    },
    priceRange: '$$$',
    serviceArea: ['Oakland', 'Berkeley', 'Alameda'],
    services: ['New Construction', 'Additions', 'Renovations'],
    aggregateRating: {
      ratingValue: 4.8,
      ratingCount: 89,
      bestRating: 5,
      worstRating: 1
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', item: 'https://marketplace.kealee.com' },
    { name: 'Contractors', item: 'https://marketplace.kealee.com/contractors' },
    { name: contractor.name, item: contractor.url }
  ];

  const faqs: FaqItem[] = [
    {
      question: `What services does ${contractor.name} offer?`,
      answer: contractor.services.join(', ')
    },
    {
      question: `Where does ${contractor.name} operate?`,
      answer: contractor.serviceArea.join(', ')
    }
  ];

  return (
    <>
      {/* Multiple structured data types on one page */}
      <StructuredData type="contractor" data={contractor} />
      <StructuredData type="breadcrumb" data={breadcrumbs} />
      <StructuredData type="faq" data={faqs} />
      
      <div>
        <h1>{contractor.name}</h1>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 6: Using Utility Functions Directly
// ============================================

import { generateContractorSchema, generateBreadcrumbSchema } from '@/lib/structured-data';

export function ContractorPageWithUtilities({ contractorId }: { contractorId: string }) {
  const contractor: Contractor = {
    // ... contractor data
    name: 'ABC Construction',
    description: 'Professional construction services',
    url: `https://marketplace.kealee.com/contractors/${contractorId}`,
    image: 'https://marketplace.kealee.com/contractors/abc.jpg',
    telephone: '+1-555-123-4567',
    address: {
      streetAddress: '123 Main St',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94107',
      addressCountry: 'US'
    },
    geo: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    priceRange: '$$',
    serviceArea: ['San Francisco'],
    services: ['General Contracting'],
    aggregateRating: {
      ratingValue: 4.5,
      ratingCount: 100,
      bestRating: 5,
      worstRating: 1
    }
  };

  const contractorSchema = generateContractorSchema(contractor);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', item: 'https://marketplace.kealee.com' },
    { name: 'Contractors', item: 'https://marketplace.kealee.com/contractors' }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contractorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div>
        <h1>{contractor.name}</h1>
        {/* Your page content */}
      </div>
    </>
  );
}
