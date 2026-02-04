// packages/shared/src/data/services.ts
// Comprehensive service data for all Kealee operations and estimation services

export interface Service {
  slug: string;
  name: string;
  category: 'operations' | 'estimation';
  price: number;
  priceUnit: 'flat' | 'per_sqft' | 'per_hour' | 'starting_at';
  description: string;
  longDescription: string;
  includes: string[];
  requirements: string[];
  deliveryTime: string;
  sampleDeliverable?: string;
  relatedServices: string[];
  frequentlyOrderedWith?: string[];
}

export const services: Service[] = [
  // ==================
  // OPERATIONS SERVICES (11)
  // ==================
  {
    slug: 'site-analysis',
    name: 'Site Analysis Report',
    category: 'operations',
    price: 125,
    priceUnit: 'flat',
    description: 'Comprehensive site assessment documenting existing conditions, constraints, and opportunities.',
    longDescription: `Our Site Analysis Report provides a thorough assessment of your property before construction begins. Our team evaluates existing conditions, identifies potential challenges, and documents opportunities that could affect your project's success.

This report is essential for architects, engineers, and contractors to understand the site constraints before design begins. We examine topography, drainage patterns, utility locations, access points, and neighboring conditions.

The analysis includes photographic documentation and a detailed written report that you can share with your design team and use throughout the permitting process.`,
    includes: [
      'On-site visit and photo documentation',
      'Topography and drainage assessment',
      'Utility location verification',
      'Access and circulation analysis',
      'Neighboring property conditions',
      'Setback and zoning verification',
      'Environmental considerations',
      'Written report with recommendations',
    ],
    requirements: [
      'Property address and legal description',
      'Current survey (if available)',
      'Access to property for site visit',
      'Contact information for site access',
    ],
    deliveryTime: '3-5 business days',
    sampleDeliverable: '/samples/site-analysis-report.pdf',
    relatedServices: ['scope-of-work', 'permit-research', 'contractor-vetting'],
    frequentlyOrderedWith: ['scope-of-work', 'quick-estimate'],
  },
  {
    slug: 'scope-of-work',
    name: 'Scope of Work Development',
    category: 'operations',
    price: 195,
    priceUnit: 'flat',
    description: 'Detailed project scope document defining all work items, specifications, and expectations.',
    longDescription: `A clear Scope of Work (SOW) is the foundation of a successful construction project. Our team develops a comprehensive document that defines exactly what work will be performed, what materials will be used, and what the finished result should look like.

This document becomes your contract exhibit, ensuring both you and your contractor have aligned expectations. It prevents scope creep, reduces change orders, and provides a clear reference for dispute resolution.

We work with you to understand your goals and translate them into specific, measurable, and verifiable work items that contractors can accurately price.`,
    includes: [
      'Project goals and objectives documentation',
      'Detailed work item descriptions',
      'Material and finish specifications',
      'Quality standards and acceptance criteria',
      'Exclusions and assumptions',
      'Phasing and sequencing (if applicable)',
      'Contractor-ready format',
      'One round of revisions',
    ],
    requirements: [
      'Completed site analysis or site photos',
      'Design drawings (if available)',
      'Material preferences and budget range',
      '30-minute consultation call',
    ],
    deliveryTime: '5-7 business days',
    sampleDeliverable: '/samples/scope-of-work.pdf',
    relatedServices: ['site-analysis', 'detailed-estimate', 'bid-package'],
    frequentlyOrderedWith: ['detailed-estimate', 'contractor-vetting'],
  },
  {
    slug: 'permit-research',
    name: 'Permit Requirements Research',
    category: 'operations',
    price: 95,
    priceUnit: 'flat',
    description: 'Research and documentation of all permit requirements for your specific project and jurisdiction.',
    longDescription: `Navigating permit requirements can be confusing and time-consuming. Our Permit Research service identifies exactly what permits you need, what documents are required, and what the timeline and costs will be.

We research your specific jurisdiction's requirements, identify any special reviews (historic, environmental, HOA), and create a clear roadmap for your permit application process.

This service is especially valuable before you finalize your design, as permit requirements can affect your project scope and timeline.`,
    includes: [
      'Jurisdiction-specific permit research',
      'Required permit types identification',
      'Document checklist for each permit',
      'Fee schedule and timeline estimates',
      'Special review requirements (historic, HOA, etc.)',
      'Inspector contact information',
      'Pre-application meeting recommendations',
      'Written summary report',
    ],
    requirements: [
      'Property address',
      'Brief project description',
      'Preliminary scope of work',
    ],
    deliveryTime: '2-3 business days',
    relatedServices: ['site-analysis', 'scope-of-work', 'permit-application'],
    frequentlyOrderedWith: ['scope-of-work', 'quick-estimate'],
  },
  {
    slug: 'contractor-vetting',
    name: 'Contractor Vetting & Verification',
    category: 'operations',
    price: 175,
    priceUnit: 'flat',
    description: 'Background verification, license check, and reference validation for potential contractors.',
    longDescription: `Hiring the right contractor is one of the most important decisions you'll make. Our Contractor Vetting service provides comprehensive due diligence on potential contractors before you sign a contract.

We verify licenses, insurance, and bonding. We check for complaints with licensing boards and consumer protection agencies. We contact references and review their work history.

You receive a detailed report that helps you make an informed decision and protects you from unlicensed or problematic contractors.`,
    includes: [
      'License verification with state/local boards',
      'Insurance certificate verification',
      'Bond verification (if applicable)',
      'BBB and consumer complaint search',
      'Court records search for liens/judgments',
      '3 reference interviews',
      'Work history verification',
      'Detailed vetting report with recommendations',
    ],
    requirements: [
      'Contractor company name and contact info',
      'License number (if known)',
      'At least 3 references from contractor',
    ],
    deliveryTime: '5-7 business days',
    relatedServices: ['bid-leveling', 'contract-review', 'scope-of-work'],
    frequentlyOrderedWith: ['bid-leveling', 'contract-review'],
  },
  {
    slug: 'bid-leveling',
    name: 'Bid Leveling & Analysis',
    category: 'operations',
    price: 245,
    priceUnit: 'flat',
    description: 'Side-by-side comparison and analysis of contractor bids to ensure apples-to-apples evaluation.',
    longDescription: `Comparing contractor bids can be challenging when each contractor formats their proposal differently and includes different items. Our Bid Leveling service creates a standardized comparison so you can make an informed decision.

We analyze each bid line-by-line, identify missing items, flag unusually low or high prices, and create a normalized comparison matrix. We also highlight qualifications, exclusions, and payment terms that could affect your total cost.

This service helps you avoid the costly mistake of choosing based solely on the lowest number without understanding what's actually included.`,
    includes: [
      'Standardized bid comparison matrix',
      'Line-item analysis of each bid',
      'Missing scope identification',
      'Price anomaly flagging',
      'Allowance and exclusion analysis',
      'Payment terms comparison',
      'Risk factor assessment',
      'Written recommendation summary',
    ],
    requirements: [
      'At least 2-3 contractor bids',
      'Original scope of work document',
      'Design drawings (if available)',
    ],
    deliveryTime: '3-5 business days',
    relatedServices: ['contractor-vetting', 'contract-review', 'detailed-estimate'],
    frequentlyOrderedWith: ['contractor-vetting', 'contract-review'],
  },
  {
    slug: 'contract-review',
    name: 'Construction Contract Review',
    category: 'operations',
    price: 295,
    priceUnit: 'flat',
    description: 'Expert review of construction contracts with redline suggestions and risk identification.',
    longDescription: `Construction contracts are complex documents with significant financial implications. Our Contract Review service provides expert analysis of your proposed contract before you sign.

We identify unfavorable terms, missing protections, and ambiguous language that could cause problems during construction. We provide specific redline suggestions to protect your interests.

This service has saved our clients thousands of dollars by preventing disputes and ensuring they have proper remedies when issues arise.`,
    includes: [
      'Full contract document review',
      'Risk identification and assessment',
      'Missing clause identification',
      'Payment terms analysis',
      'Change order provisions review',
      'Warranty and liability assessment',
      'Dispute resolution terms review',
      'Redlined contract with suggested changes',
      '30-minute consultation to discuss findings',
    ],
    requirements: [
      'Proposed construction contract',
      'Associated scope of work',
      'Any addenda or attachments',
    ],
    deliveryTime: '3-5 business days',
    relatedServices: ['bid-leveling', 'contractor-vetting', 'draw-review'],
    frequentlyOrderedWith: ['bid-leveling', 'contractor-vetting'],
  },
  {
    slug: 'draw-review',
    name: 'Draw Request Review',
    category: 'operations',
    price: 145,
    priceUnit: 'flat',
    description: 'Verification that contractor draw requests match completed work before you release payment.',
    longDescription: `Pay applications (draw requests) should accurately reflect work completed. Our Draw Review service verifies that the contractor's billing matches the actual progress on site.

We compare the draw request against the contract schedule of values, review supporting documentation, and provide our assessment of whether the requested amount is appropriate.

This service protects you from overpaying for incomplete work and ensures you maintain proper leverage throughout the project.`,
    includes: [
      'Draw request document review',
      'Schedule of values comparison',
      'Progress percentage verification',
      'Stored materials assessment',
      'Retainage calculation check',
      'Change order integration review',
      'Lien waiver verification',
      'Written approval or adjustment recommendation',
    ],
    requirements: [
      'Current draw request',
      'Original contract and schedule of values',
      'Photos of current site conditions',
      'Previous draw history',
    ],
    deliveryTime: '2-3 business days',
    relatedServices: ['contract-review', 'punch-list', 'closeout-review'],
  },
  {
    slug: 'punch-list',
    name: 'Punch List Development',
    category: 'operations',
    price: 225,
    priceUnit: 'flat',
    description: 'Professional punch list inspection documenting all items requiring completion or correction.',
    longDescription: `A thorough punch list is essential before final payment. Our team conducts a detailed inspection of your project, documenting every item that needs completion, correction, or touch-up.

We use a standardized format that's clear for contractors to address, with photos and locations for each item. This ensures nothing is missed and provides documentation for warranty claims.

Our systematic approach typically identifies 30-50% more items than untrained homeowner inspections.`,
    includes: [
      'Comprehensive on-site inspection',
      'Room-by-room documentation',
      'Photo documentation of each item',
      'Priority categorization',
      'Contractor-ready punch list format',
      'Code compliance verification',
      'Finish quality assessment',
      'Follow-up verification available',
    ],
    requirements: [
      'Project substantially complete (95%+)',
      'Access to entire property',
      'Original scope of work and specifications',
      '2-3 hour site access window',
    ],
    deliveryTime: '2-3 business days after inspection',
    relatedServices: ['draw-review', 'closeout-review', 'warranty-claim'],
    frequentlyOrderedWith: ['closeout-review'],
  },
  {
    slug: 'closeout-review',
    name: 'Project Closeout Review',
    category: 'operations',
    price: 175,
    priceUnit: 'flat',
    description: 'Verification of all closeout documents, warranties, and final deliverables before final payment.',
    longDescription: `Project closeout is more than just a final walk-through. Our Closeout Review ensures you receive all the documentation and warranties you're entitled to before releasing final payment.

We verify that you have all required permits closed, warranties transferred, operation manuals provided, and as-built drawings delivered. We create a checklist of any missing items.

This documentation is essential for future maintenance, insurance claims, and eventual property sale.`,
    includes: [
      'Permit closure verification',
      'Certificate of occupancy confirmation',
      'Warranty documentation review',
      'O&M manual verification',
      'As-built drawing checklist',
      'Lien release collection',
      'Final inspection coordination',
      'Closeout document binder organization',
    ],
    requirements: [
      'All work substantially complete',
      'Final punch list items addressed',
      'Contractor closeout submittal package',
    ],
    deliveryTime: '3-5 business days',
    relatedServices: ['punch-list', 'draw-review', 'warranty-claim'],
    frequentlyOrderedWith: ['punch-list'],
  },
  {
    slug: 'warranty-claim',
    name: 'Warranty Claim Assistance',
    category: 'operations',
    price: 150,
    priceUnit: 'flat',
    description: 'Help documenting and pursuing warranty claims with contractors or manufacturers.',
    longDescription: `When something goes wrong after construction, getting warranty work performed can be frustrating. Our Warranty Claim Assistance service helps you document the issue, understand your warranty rights, and pursue resolution.

We review your warranty documents, document the defect with photos and descriptions, and prepare a formal claim letter. We can also help coordinate with the contractor or manufacturer to get the issue resolved.

Our experience with construction warranties helps you navigate the process and avoid common pitfalls that void coverage.`,
    includes: [
      'Warranty document review',
      'Defect documentation and photography',
      'Warranty coverage analysis',
      'Formal claim letter preparation',
      'Contractor/manufacturer communication',
      'Resolution tracking',
      'Escalation assistance if needed',
    ],
    requirements: [
      'Original warranty documents',
      'Description and photos of defect',
      'Timeline of when issue was discovered',
      'Previous communication attempts (if any)',
    ],
    deliveryTime: '2-3 business days initial, ongoing as needed',
    relatedServices: ['closeout-review', 'punch-list', 'contract-review'],
  },
  {
    slug: 'permit-application',
    name: 'Permit Application Preparation',
    category: 'operations',
    price: 295,
    priceUnit: 'flat',
    description: 'Complete preparation and submission of permit applications on your behalf.',
    longDescription: `Let us handle the paperwork. Our Permit Application Preparation service takes care of filling out all required forms, organizing documents, and submitting your permit application correctly the first time.

We know the specific requirements for jurisdictions throughout the DC-Baltimore corridor. We ensure your application is complete, properly formatted, and submitted with all required fees.

This service significantly reduces the risk of rejection due to incomplete or incorrect submissions.`,
    includes: [
      'Application form completion',
      'Document organization and formatting',
      'Fee calculation and payment processing',
      'Online portal submission (where available)',
      'Confirmation and tracking number',
      'Initial review response handling',
      'Correction resubmission (one round)',
      'Status updates throughout process',
    ],
    requirements: [
      'Completed design drawings',
      'Property ownership verification',
      'Contractor license info (if required)',
      'Completed permit research (or order together)',
    ],
    deliveryTime: '3-5 business days to submit',
    relatedServices: ['permit-research', 'scope-of-work', 'site-analysis'],
    frequentlyOrderedWith: ['permit-research'],
  },

  // ==================
  // ESTIMATION SERVICES (7)
  // ==================
  {
    slug: 'quick-estimate',
    name: 'Quick Estimate',
    category: 'estimation',
    price: 195,
    priceUnit: 'flat',
    description: 'Ballpark cost estimate within 48 hours for preliminary budgeting and feasibility.',
    longDescription: `Need a quick budget number before investing in detailed plans? Our Quick Estimate provides a reliable ballpark figure based on your project description and local market data.

This estimate is based on cost-per-square-foot data and recent project comparables in your area. It's not suitable for contractor bidding but gives you confidence that your project is financially feasible before spending on design.

We include a range (low/medium/high) to account for finish levels and market variations.`,
    includes: [
      'Cost-per-square-foot analysis',
      'Local market adjustment',
      'Low/medium/high range',
      'Major cost driver breakdown',
      'Comparable project references',
      'Budget feasibility assessment',
      'Written estimate report',
    ],
    requirements: [
      'Project description',
      'Approximate square footage',
      'Finish level expectations (basic/mid/high)',
      'Property location',
    ],
    deliveryTime: '24-48 hours',
    relatedServices: ['detailed-estimate', 'scope-of-work', 'site-analysis'],
    frequentlyOrderedWith: ['site-analysis', 'permit-research'],
  },
  {
    slug: 'detailed-estimate',
    name: 'Detailed Construction Estimate',
    category: 'estimation',
    price: 595,
    priceUnit: 'starting_at',
    description: 'Line-item estimate with quantities, unit costs, and labor breakdown from design drawings.',
    longDescription: `Our Detailed Estimate provides a comprehensive line-item breakdown of your project costs, suitable for budgeting, contractor negotiation, and draw schedule development.

We perform a complete takeoff from your design drawings, applying current material prices and labor rates for your area. Each line item includes quantity, unit cost, and total—giving you full visibility into where your money goes.

This estimate becomes your baseline for evaluating contractor bids and managing project costs.`,
    includes: [
      'Complete quantity takeoff from drawings',
      'Line-item cost breakdown',
      'Material and labor separation',
      'Current local pricing data',
      'General conditions and overhead',
      'Contingency recommendations',
      'Cost summary by CSI division',
      'Excel format for contractor comparison',
    ],
    requirements: [
      'Complete design drawings (floor plans, elevations)',
      'Specifications or material selections',
      'Site address for location-based pricing',
    ],
    deliveryTime: '5-7 business days',
    sampleDeliverable: '/samples/detailed-estimate.pdf',
    relatedServices: ['bid-package', 'value-engineering', 'bid-estimate'],
    frequentlyOrderedWith: ['scope-of-work', 'bid-package'],
  },
  {
    slug: 'bid-estimate',
    name: 'Contractor Bid Estimate',
    category: 'estimation',
    price: 795,
    priceUnit: 'starting_at',
    description: 'Estimate formatted for contractor bidding with schedule of values and bid form.',
    longDescription: `When you're ready to get contractor bids, our Bid Estimate package gives you everything needed to run a professional bidding process.

This includes a detailed estimate formatted as a schedule of values, a standardized bid form for contractors, and instructions that ensure you get comparable, complete bids.

Contractors appreciate the clear format, and you benefit from receiving organized bids that are easy to compare.`,
    includes: [
      'Complete detailed estimate',
      'Schedule of values format',
      'Standardized bid form template',
      'Bid instructions document',
      'Allowance recommendations',
      'Alternates identification',
      'Bid comparison matrix template',
      'Pre-bid meeting agenda (if needed)',
    ],
    requirements: [
      'Complete construction drawings',
      'Specifications document',
      'Project schedule requirements',
    ],
    deliveryTime: '7-10 business days',
    relatedServices: ['detailed-estimate', 'bid-leveling', 'contractor-vetting'],
    frequentlyOrderedWith: ['contractor-vetting', 'bid-leveling'],
  },
  {
    slug: 'value-engineering',
    name: 'Value Engineering Analysis',
    category: 'estimation',
    price: 495,
    priceUnit: 'flat',
    description: 'Cost reduction recommendations without sacrificing quality or function.',
    longDescription: `When your estimate exceeds your budget, Value Engineering finds savings without compromising your project's quality or function.

We analyze your design and specifications to identify cost-saving alternatives. These might include material substitutions, design simplifications, phasing strategies, or contractor packaging optimizations.

Each recommendation includes the potential savings, any trade-offs, and our assessment of whether it's worth considering.`,
    includes: [
      'Complete estimate review',
      'Cost driver analysis',
      'Alternative material research',
      'Design simplification suggestions',
      'Phasing strategy options',
      'Savings quantification for each option',
      'Trade-off analysis',
      'Prioritized recommendations report',
    ],
    requirements: [
      'Current estimate or contractor bid',
      'Design drawings',
      'Target budget amount',
      'Non-negotiable requirements list',
    ],
    deliveryTime: '5-7 business days',
    relatedServices: ['detailed-estimate', 'scope-of-work', 'bid-leveling'],
    frequentlyOrderedWith: ['detailed-estimate'],
  },
  {
    slug: 'change-order-estimate',
    name: 'Change Order Pricing Review',
    category: 'estimation',
    price: 175,
    priceUnit: 'flat',
    description: 'Independent verification of contractor change order pricing.',
    longDescription: `Change orders are where projects go over budget. Our Change Order Pricing Review provides an independent assessment of whether the contractor's pricing is fair.

We analyze the change order scope, research current material and labor costs, and provide our assessment of what the change should cost. This gives you negotiating power and ensures you don't overpay.

If the contractor's price is fair, you have confidence to approve. If it's not, you have data to negotiate.`,
    includes: [
      'Change order scope analysis',
      'Independent cost estimate',
      'Market rate verification',
      'Markup analysis',
      'Fair price assessment',
      'Negotiation recommendations',
      'Written review report',
    ],
    requirements: [
      'Contractor change order proposal',
      'Original contract and scope',
      'Description of changed conditions',
    ],
    deliveryTime: '2-3 business days',
    relatedServices: ['draw-review', 'contract-review', 'detailed-estimate'],
  },
  {
    slug: 'insurance-estimate',
    name: 'Insurance Claim Estimate',
    category: 'estimation',
    price: 395,
    priceUnit: 'starting_at',
    description: 'Detailed repair estimate formatted for insurance claims with Xactimate compatibility.',
    longDescription: `Insurance claims require estimates in specific formats with specific pricing databases. Our Insurance Claim Estimates are formatted to work with insurance adjusters and use industry-standard pricing.

We document the damage scope, prepare a detailed repair estimate, and format it in a way that insurance companies recognize. This helps ensure you receive fair compensation for covered losses.

We can also review insurance company estimates and identify items that may have been missed or underpriced.`,
    includes: [
      'Damage scope documentation',
      'Detailed repair estimate',
      'Xactimate-compatible format',
      'Photo documentation integration',
      'Code upgrade identification',
      'Depreciation analysis',
      'Supplement preparation (if needed)',
      'Adjuster meeting support',
    ],
    requirements: [
      'Access to damaged property',
      'Insurance policy information',
      'Claim number and adjuster contact',
      'Previous repair estimates (if any)',
    ],
    deliveryTime: '3-5 business days',
    relatedServices: ['detailed-estimate', 'scope-of-work'],
  },
  {
    slug: 'feasibility-analysis',
    name: 'Project Feasibility Analysis',
    category: 'estimation',
    price: 695,
    priceUnit: 'flat',
    description: 'Comprehensive financial analysis including cost estimate, timeline, and ROI projections.',
    longDescription: `Before committing to a major project, understand the full picture. Our Feasibility Analysis combines cost estimation with timeline projection and return on investment analysis.

This is particularly valuable for renovation projects where you want to understand if the investment makes financial sense, or for developers evaluating potential acquisitions.

We provide clear go/no-go recommendations based on the numbers.`,
    includes: [
      'Preliminary cost estimate',
      'Project timeline projection',
      'Permit timeline research',
      'ROI calculation (if applicable)',
      'Risk factor identification',
      'Market comparison analysis',
      'Financing considerations',
      'Written feasibility report',
      'Go/no-go recommendation',
    ],
    requirements: [
      'Property information',
      'Preliminary project scope',
      'Budget parameters',
      'Investment goals (if applicable)',
    ],
    deliveryTime: '7-10 business days',
    relatedServices: ['site-analysis', 'quick-estimate', 'permit-research'],
    frequentlyOrderedWith: ['site-analysis', 'permit-research'],
  },
];

// Helper function to get all service slugs for generateStaticParams
export function getAllServiceSlugs(): string[] {
  return services.map((service) => service.slug);
}

// Helper function to get a service by slug
export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}

// Helper function to get services by category
export function getServicesByCategory(category: 'operations' | 'estimation'): Service[] {
  return services.filter((service) => service.category === category);
}

// Helper function to get related services
export function getRelatedServices(slug: string): Service[] {
  const service = getServiceBySlug(slug);
  if (!service) return [];
  return service.relatedServices
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter((s): s is Service => s !== undefined);
}

// Helper function to get frequently ordered together services
export function getFrequentlyOrderedWith(slug: string): Service[] {
  const service = getServiceBySlug(slug);
  if (!service || !service.frequentlyOrderedWith) return [];
  return service.frequentlyOrderedWith
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter((s): s is Service => s !== undefined);
}
