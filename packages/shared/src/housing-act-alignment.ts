/**
 * Housing Act Alignment — maps platform features to legislative provisions
 * Reference: Rebuilding America's Housing Act (Sections 201-211)
 */

export interface HousingActProvision {
  section: string;
  title: string;
  description: string;
  kealeeFeatures: string[];
  primaryService: string;
  supportingServices: string[];
  status: 'active' | 'planned' | 'partial';
}

export const HOUSING_ACT_PROVISIONS: HousingActProvision[] = [
  {
    section: 'Sec 201',
    title: 'Reduce Regulatory Barriers',
    description: 'Streamline zoning and land-use regulations that impede housing construction',
    kealeeFeatures: [
      'AI zoning analysis (OS-Land)',
      'Pattern book compliance checking',
      'Automated code review',
      'Zoning overlay mapping',
    ],
    primaryService: 'os-land',
    supportingServices: ['os-feas', 'core-rules'],
    status: 'active',
  },
  {
    section: 'Sec 202',
    title: 'Speed Housing Approvals',
    description: 'Accelerate permitting and approval processes for housing projects',
    kealeeFeatures: [
      'Automated permit tracking',
      'Digital submission workflows',
      'Inspection scheduling',
      'Status notification system',
    ],
    primaryService: 'os-pm',
    supportingServices: ['core-notifications', 'core-workflows'],
    status: 'active',
  },
  {
    section: 'Sec 203',
    title: 'Reusable Design Workflows',
    description: 'Promote reusable, pre-approved building designs and pattern books',
    kealeeFeatures: [
      'Pattern book library',
      'Pre-approved plan templates',
      'Design compliance checker',
      'Template marketplace',
    ],
    primaryService: 'os-land',
    supportingServices: ['marketplace'],
    status: 'active',
  },
  {
    section: 'Sec 204',
    title: 'Strengthen Housing Finance',
    description: 'Modernize FHA, HOME, and housing finance programs',
    kealeeFeatures: [
      'HUD eligibility assessment',
      'Capital stack builder',
      'Draw tracking with lien waivers',
      'Investor reporting',
      'FHA multifamily analysis',
    ],
    primaryService: 'os-dev',
    supportingServices: ['os-feas', 'os-pay'],
    status: 'active',
  },
  {
    section: 'Sec 205',
    title: 'Housing Innovation Fund',
    description: '$200M Innovation Fund for innovative housing solutions',
    kealeeFeatures: [
      'Innovation fund eligibility checker',
      'Grant application tracking',
      'CDBG/HOME program analysis',
      'Impact measurement dashboard',
    ],
    primaryService: 'os-dev',
    supportingServices: ['core-analytics'],
    status: 'partial',
  },
  {
    section: 'Sec 206',
    title: 'Local Capacity Building',
    description: 'Support local government housing capacity and workforce development',
    kealeeFeatures: [
      'Municipal housing dashboard',
      'Jurisdiction analytics',
      'Apprenticeship tracking',
      'Workforce pipeline metrics',
    ],
    primaryService: 'core-analytics',
    supportingServices: ['os-pm'],
    status: 'partial',
  },
  {
    section: 'Sec 207',
    title: 'Affordable Housing Preservation',
    description: 'Protect and preserve existing affordable housing stock',
    kealeeFeatures: [
      'Affordable unit tracking',
      'AMI percentage monitoring',
      'Workforce housing eligibility',
      'Compliance reporting',
    ],
    primaryService: 'os-ops',
    supportingServices: ['core-rules', 'core-analytics'],
    status: 'planned',
  },
  {
    section: 'Sec 208',
    title: 'Fair Housing Modernization',
    description: 'Update fair housing requirements for modern development',
    kealeeFeatures: [
      'Fair housing compliance rules',
      'Accessibility checklist integration',
      'Demographic impact analysis',
    ],
    primaryService: 'core-rules',
    supportingServices: ['os-pm'],
    status: 'planned',
  },
  {
    section: 'Sec 209',
    title: 'Community Development Integration',
    description: 'Integrate housing with community development goals',
    kealeeFeatures: [
      'Mixed-use feasibility modeling',
      'Community impact scoring',
      'Transit-oriented development analysis',
    ],
    primaryService: 'os-feas',
    supportingServices: ['os-land', 'core-analytics'],
    status: 'partial',
  },
  {
    section: 'Sec 210',
    title: 'Construction Workforce',
    description: 'Address construction workforce shortages',
    kealeeFeatures: [
      'Contractor marketplace matchmaking',
      'Skills verification',
      'Labor availability tracking',
      'Apprenticeship program integration',
    ],
    primaryService: 'marketplace',
    supportingServices: ['core-analytics'],
    status: 'active',
  },
  {
    section: 'Sec 211',
    title: 'Land to Delivery Pipeline',
    description: 'Full lifecycle from land identification to housing delivery',
    kealeeFeatures: [
      'DDTS lifecycle tracking (LAND→FEAS→PERMITS→CONSTRUCTION→OPS)',
      'Digital twin per project',
      'Cross-phase KPI monitoring',
      'Automated phase gate enforcement',
    ],
    primaryService: 'core-ddts',
    supportingServices: ['os-land', 'os-feas', 'os-pm', 'os-dev', 'os-ops'],
    status: 'active',
  },
];

/**
 * Get provisions by service
 */
export function getProvisionsByService(service: string): HousingActProvision[] {
  return HOUSING_ACT_PROVISIONS.filter(
    p => p.primaryService === service || p.supportingServices.includes(service)
  );
}

/**
 * Get active feature count
 */
export function getAlignmentSummary() {
  const total = HOUSING_ACT_PROVISIONS.length;
  const active = HOUSING_ACT_PROVISIONS.filter(p => p.status === 'active').length;
  const partial = HOUSING_ACT_PROVISIONS.filter(p => p.status === 'partial').length;
  const planned = HOUSING_ACT_PROVISIONS.filter(p => p.status === 'planned').length;

  return { total, active, partial, planned, coveragePercent: Math.round(((active + partial * 0.5) / total) * 100) };
}
