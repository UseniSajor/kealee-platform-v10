// Centralized product catalog for m-marketplace (central commerce hub)
// Aggregates products from all Kealee apps

import { type ProductData } from './cart-context'

// ── PM Managed Service Packages ─────────────────────────────
export const pmPackages: ProductData[] = [
  { id: 'pm-pkg-a', name: 'PM Package A — Starter', price: 1750, priceLabel: '$1,750', unit: '/mo', category: 'pm-package', appSource: 'ops-services' },
  { id: 'pm-pkg-b', name: 'PM Package B — Professional', price: 3750, priceLabel: '$3,750', unit: '/mo', category: 'pm-package', appSource: 'ops-services' },
  { id: 'pm-pkg-c', name: 'PM Package C — Premium', price: 9500, priceLabel: '$9,500', unit: '/mo', category: 'pm-package', appSource: 'ops-services' },
  { id: 'pm-pkg-d', name: 'PM Package D — Enterprise', price: 16500, priceLabel: '$16,500', unit: '/mo', category: 'pm-package', appSource: 'ops-services' },
]

// ── PM Software Plans ───────────────────────────────────────
export const softwarePlans: ProductData[] = [
  { id: 'sw-essentials', name: 'PM Software — Essentials', price: 99, priceLabel: '$99', unit: '/user/mo', category: 'software', appSource: 'ops-services' },
  { id: 'sw-performance', name: 'PM Software — Performance', price: 199, priceLabel: '$199', unit: '/user/mo', category: 'software', appSource: 'ops-services' },
  { id: 'sw-scale', name: 'PM Software — Scale', price: 349, priceLabel: '$349', unit: '/user/mo', category: 'software', appSource: 'ops-services' },
]

// ── Permit Service Packages ─────────────────────────────────
export const permitPackages: ProductData[] = [
  { id: 'permit-pkg-a', name: 'Permit Package A — Single Permit', price: 495, priceLabel: '$495', unit: 'one-time', category: 'permit-package', appSource: 'permits' },
  { id: 'permit-pkg-b', name: 'Permit Package B — Builder', price: 1295, priceLabel: '$1,295', unit: '/mo', category: 'permit-package', appSource: 'permits' },
  { id: 'permit-pkg-c', name: 'Permit Package C — Enterprise', price: 2995, priceLabel: '$2,995', unit: '/mo', category: 'permit-package', appSource: 'permits' },
  { id: 'permit-pkg-d', name: 'Permit Package D — Portfolio', price: 7500, priceLabel: '$7,500', unit: '/mo', category: 'permit-package', appSource: 'permits' },
]

// ── Individual PM Services ──────────────────────────────────
export const individualServices: ProductData[] = [
  { id: 'ind-permit-filing', name: 'Permit Application Filing', price: 300, priceLabel: '$200-$400', unit: 'per permit', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-inspection', name: 'Inspection Scheduling', price: 150, priceLabel: '$150', unit: 'per inspection', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-site-visit', name: 'Site Visit & Documentation', price: 250, priceLabel: '$250', unit: 'per visit', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-vendor-sched', name: 'Vendor/Sub Scheduling', price: 250, priceLabel: '$250', unit: 'per week', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-weekly-report', name: 'Weekly Client Report', price: 150, priceLabel: '$150', unit: 'per report', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-takeoff', name: 'Quantity Takeoff', price: 550, priceLabel: '$300-$800', unit: 'per project', category: 'individual', appSource: 'estimation' },
  { id: 'ind-scope-review', name: 'Scope of Work Review', price: 375, priceLabel: '$250-$500', unit: 'per review', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-bid-package', name: 'Bid Package Preparation', price: 875, priceLabel: '$500-$1,250', unit: 'per package', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-feasibility', name: 'Feasibility Study', price: 3750, priceLabel: '$2,500-$5,000', unit: 'per study', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-pro-forma', name: 'Pro Forma Analysis', price: 2250, priceLabel: '$1,500-$3,000', unit: 'per analysis', category: 'individual', appSource: 'ops-services' },
  { id: 'ind-entitlement', name: 'Entitlement Support', price: 5250, priceLabel: '$3,000-$7,500', unit: 'per project', category: 'individual', appSource: 'ops-services' },
]

// ── Estimation Services ─────────────────────────────────────
export const estimationServices: ProductData[] = [
  { id: 'est-quick', name: 'Quick Budget Estimate', price: 295, priceLabel: '$295', unit: 'same day', category: 'estimation', appSource: 'estimation' },
  { id: 'est-conceptual', name: 'Conceptual Estimate', price: 745, priceLabel: '$495-$995', unit: '1-2 days', category: 'estimation', appSource: 'estimation' },
  { id: 'est-detailed', name: 'Detailed Estimate', price: 1995, priceLabel: '$995-$2,995', unit: '3-5 days', category: 'estimation', appSource: 'estimation' },
  { id: 'est-takeoff', name: 'Takeoff Services', price: 945, priceLabel: '$395-$1,495', unit: '1-3 days', category: 'estimation', appSource: 'estimation' },
  { id: 'est-ve', name: 'Value Engineering Review', price: 1345, priceLabel: '$695-$1,995', unit: '2-3 days', category: 'estimation', appSource: 'estimation' },
  { id: 'est-bid-prep', name: 'Bid Package Preparation', price: 1645, priceLabel: '$795-$2,495', unit: '2-5 days', category: 'estimation', appSource: 'estimation' },
]

// ── Escrow & Finance ────────────────────────────────────────
export const financeServices: ProductData[] = [
  { id: 'fin-escrow-setup', name: 'Escrow Account Setup', price: 250, priceLabel: '$250', unit: 'one-time', category: 'finance', appSource: 'finance-trust' },
  { id: 'fin-co-processing', name: 'Change Order Processing', price: 75, priceLabel: '$75', unit: 'per CO', category: 'finance', appSource: 'finance-trust' },
  { id: 'fin-maintenance', name: 'Monthly Account Maintenance', price: 50, priceLabel: '$50', unit: '/mo', category: 'finance', appSource: 'finance-trust' },
  { id: 'fin-dispute', name: 'Dispute Resolution', price: 150, priceLabel: '$150', unit: '/hr', category: 'finance', appSource: 'finance-trust' },
  { id: 'fin-rush', name: 'Rush Processing', price: 150, priceLabel: '$150', unit: 'per request', category: 'finance', appSource: 'finance-trust' },
]

// ── Operations Services ─────────────────────────────────────
export const operationsProducts: ProductData[] = [
  { id: 'ops-cpm', name: 'Project Scheduling (CPM)', price: 125, priceLabel: '$125', unit: '/project', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-doc-control', name: 'Document Control Setup', price: 150, priceLabel: '$150', unit: '/project', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-rfi', name: 'RFI Management', price: 175, priceLabel: '$175', unit: '/project', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-submittal', name: 'Submittal Management', price: 175, priceLabel: '$175', unit: '/project', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-conceptual-est', name: 'Conceptual Estimate', price: 195, priceLabel: '$195', unit: '/estimate', category: 'operations', appSource: 'estimation' },
  { id: 'ops-schematic-est', name: 'Schematic Estimate', price: 495, priceLabel: '$495', unit: '/estimate', category: 'operations', appSource: 'estimation' },
  { id: 'ops-detailed-est', name: 'Detailed Estimate', price: 1495, priceLabel: '$1,495', unit: '/estimate', category: 'operations', appSource: 'estimation' },
  { id: 'ops-ve', name: 'Value Engineering', price: 1995, priceLabel: '$1,995', unit: '/analysis', category: 'operations', appSource: 'estimation' },
  { id: 'ops-qc', name: 'Quality Control Inspection', price: 225, priceLabel: '$225', unit: '/inspection', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-safety-plan', name: 'Safety Plan Development', price: 250, priceLabel: '$250', unit: '/plan', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-osha', name: 'OSHA Compliance Review', price: 295, priceLabel: '$295', unit: '/review', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-bim', name: 'BIM Coordination', price: 495, priceLabel: '$495', unit: '/model', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-site-logistics', name: 'Site Logistics Planning', price: 595, priceLabel: '$595', unit: '/plan', category: 'operations', appSource: 'ops-services' },
  { id: 'ops-closeout', name: 'Closeout Documentation', price: 395, priceLabel: '$395', unit: '/project', category: 'operations', appSource: 'ops-services' },
]

// ── All Products ────────────────────────────────────────────
export const allProducts: ProductData[] = [
  ...pmPackages,
  ...softwarePlans,
  ...permitPackages,
  ...individualServices,
  ...estimationServices,
  ...financeServices,
  ...operationsProducts,
]

export function getProductById(id: string): ProductData | undefined {
  return allProducts.find(p => p.id === id)
}

export const productCategories = [
  { key: 'all', label: 'All Products' },
  { key: 'pm-package', label: 'PM Packages' },
  { key: 'software', label: 'PM Software' },
  { key: 'permit-package', label: 'Permit Packages' },
  { key: 'individual', label: 'Individual Services' },
  { key: 'estimation', label: 'Estimation' },
  { key: 'finance', label: 'Finance & Escrow' },
  { key: 'operations', label: 'Operations Services' },
]
