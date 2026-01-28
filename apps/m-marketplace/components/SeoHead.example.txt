/**
 * SEO Head Component Usage Examples
 * 
 * This file shows how to use the SEO components in different scenarios
 */

// ============================================
// Example 1: Using SeoHead in App Router (app/ directory)
// ============================================

import SeoHead from '@/components/SeoHead';

export default function ContractorPage() {
  return (
    <>
      <SeoHead
        title="Find Top Construction Contractors"
        description="Browse our directory of verified construction contractors. Read reviews, compare quotes, and find the perfect contractor for your project."
        canonicalUrl="https://marketplace.kealee.com/contractors"
        ogImage="https://marketplace.kealee.com/og-contractors.jpg"
      />
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 2: Using generateSeoMetadata in App Router page.tsx
// ============================================

import { generateSeoMetadata, generateSchemaMarkup } from '@/lib/seo';
import SeoHead from '@/components/SeoHead';

export const metadata = generateSeoMetadata({
  title: 'Contractor Directory',
  description: 'Find verified construction contractors',
  canonicalUrl: 'https://marketplace.kealee.com/contractors',
});

export default function ContractorDirectoryPage() {
  return (
    <>
      <SeoHead schemaMarkup={generateSchemaMarkup()} />
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 3: Custom Schema Markup
// ============================================

import SeoHead from '@/components/SeoHead';
import { generateBreadcrumbSchema } from '@/lib/seo';

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const customSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Construction Project',
      provider: {
        '@type': 'LocalBusiness',
        name: 'Kealee Marketplace'
      }
    },
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://marketplace.kealee.com' },
      { name: 'Projects', url: 'https://marketplace.kealee.com/projects' },
      { name: `Project ${projectId}`, url: `https://marketplace.kealee.com/projects/${projectId}` }
    ])
  ];

  return (
    <>
      <SeoHead
        title={`Project ${projectId} Details`}
        description="View project details and contractor information"
        canonicalUrl={`https://marketplace.kealee.com/projects/${projectId}`}
        schemaMarkup={customSchema}
      />
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}

// ============================================
// Example 4: Noindex for Private Pages
// ============================================

import SeoHead from '@/components/SeoHead';

export default function DashboardPage() {
  return (
    <>
      <SeoHead
        title="Dashboard"
        description="Your project dashboard"
        noindex={true} // Prevents search engine indexing
      />
      <div>
        {/* Your private dashboard content */}
      </div>
    </>
  );
}

// ============================================
// Example 5: Using in Pages Router (pages/ directory)
// ============================================

import SeoHeadPages from '@/components/SeoHeadPages';

export default function ContractorPagePagesRouter() {
  return (
    <>
      <SeoHeadPages
        title="Find Top Construction Contractors"
        description="Browse our directory of verified construction contractors"
        canonicalUrl="https://marketplace.kealee.com/contractors"
      />
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}
