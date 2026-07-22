export type JurisdictionOutcome = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE'
  | 'MISSING_DATA' | 'PROFESSIONAL_DETERMINATION_REQUIRED';

export interface RuleAuthority {
  agency: string;
  title: string;
  url: string;
  effectiveDate?: string;
  lastVerifiedDate: string;
}
export interface JurisdictionCheckResult {
  ruleKey: string;
  outcome: JurisdictionOutcome;
  requirement: string;
  inputs: Record<string, unknown>;
  authority: RuleAuthority;
  responsibleDiscipline: string;
  remediation?: string;
  blocksSubmission: boolean;
}
export interface JurisdictionRulePack<TInput> {
  jurisdictionCode: string;
  version: string;
  evaluate(input: TInput): JurisdictionCheckResult[];
}

export interface PrinceGeorgesSiteInput {
  projectType: 'NEW_SINGLE_FAMILY' | 'RESIDENTIAL_INFILL' | 'OTHER';
  landDisturbanceSqFt?: number;
  earthMovementCubicYards?: number;
  totalDisturbanceAcres?: number;
  woodlandClearing: boolean;
  existingTcp: boolean;
  floodplainScreenPositive: boolean;
  wetlandOrStreamScreenPositive: boolean;
  drivewayOrRightOfWayWork: boolean;
  lotCount?: number;
  frontsExistingBuiltStreet?: boolean;
  surveyVerified: boolean;
  professionalApprovalPresent: boolean;
  woodlandDocumentationPresent: boolean;
  sedimentControlPlanPresent: boolean;
  stormwaterConceptPresent: boolean;
}

const VERIFIED = '2026-07-21';
const PGC_PERMITS: RuleAuthority = {
  agency: "Prince George's County Department of Permitting, Inspections and Enforcement",
  title: 'Site/Road Plan Review and Residential Building Permit requirements',
  url: 'https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement',
  lastVerifiedDate: VERIFIED,
};
const PGSCD: RuleAuthority = {
  agency: "Prince George's Soil Conservation District",
  title: 'Erosion and sediment control plan review',
  url: 'https://www.pgscd.org/',
  lastVerifiedDate: VERIFIED,
};
const MNCPPC: RuleAuthority = {
  agency: 'M-NCPPC Prince George’s County Planning Department',
  title: 'Environmental Planning and woodland conservation',
  url: 'https://www.pgplanning.org/',
  lastVerifiedDate: VERIFIED,
};
const MDE: RuleAuthority = {
  agency: 'Maryland Department of the Environment',
  title: 'General Permit for Stormwater Associated with Construction Activity',
  url: 'https://mde.maryland.gov/programs/water/StormwaterManagementProgram/Pages/storm_gen_permit.aspx',
  lastVerifiedDate: VERIFIED,
};

function result(ruleKey: string, outcome: JurisdictionOutcome, requirement: string,
  inputs: Record<string, unknown>, authority: RuleAuthority, responsibleDiscipline: string,
  blocksSubmission = false, remediation?: string): JurisdictionCheckResult {
  return { ruleKey, outcome, requirement, inputs, authority, responsibleDiscipline, blocksSubmission, remediation };
}

export const princeGeorgesCountyRulePack: JurisdictionRulePack<PrinceGeorgesSiteInput> = {
  jurisdictionCode: 'US-MD-PRINCE_GEORGES',
  version: '2026-07-21.1',
  evaluate(input) {
    const checks: JurisdictionCheckResult[] = [];
    const disturbance = input.landDisturbanceSqFt;
    checks.push(disturbance === undefined
      ? result('PG_LAND_DISTURBANCE_5000', 'MISSING_DATA', 'Determine total land disturbance.', {}, PGSCD, 'CIVIL_ENGINEER', true)
      : disturbance > 5000
        ? result('PG_LAND_DISTURBANCE_5000', input.sedimentControlPlanPresent ? 'PASS' : 'FAIL',
          'Disturbance over 5,000 square feet requires sediment-control review and applicable approval/green stamp.',
          { landDisturbanceSqFt: disturbance }, PGSCD, 'CIVIL_ENGINEER', !input.sedimentControlPlanPresent,
          input.sedimentControlPlanPresent ? undefined : 'Prepare and obtain approval of the sediment-control plan.')
        : result('PG_LAND_DISTURBANCE_5000', 'NOT_APPLICABLE', '5,000-square-foot disturbance trigger is not exceeded.',
          { landDisturbanceSqFt: disturbance }, PGSCD, 'CIVIL_ENGINEER'));

    const earth = input.earthMovementCubicYards;
    checks.push(earth === undefined
      ? result('PG_EARTH_MOVEMENT_100_CY', 'MISSING_DATA', 'Calculate cut and fill volume.', {}, PGC_PERMITS, 'CIVIL_ENGINEER', true)
      : earth > 100
        ? result('PG_EARTH_MOVEMENT_100_CY', 'PROFESSIONAL_DETERMINATION_REQUIRED',
          'Earth movement over 100 cubic yards triggers grading/site review screening.', { earthMovementCubicYards: earth },
          PGC_PERMITS, 'CIVIL_ENGINEER', true, 'Licensed civil engineer must confirm the grading permit path and design.')
        : result('PG_EARTH_MOVEMENT_100_CY', 'NOT_APPLICABLE', '100-cubic-yard screening threshold is not exceeded.',
          { earthMovementCubicYards: earth }, PGC_PERMITS, 'CIVIL_ENGINEER'));

    const acres = input.totalDisturbanceAcres;
    checks.push(acres === undefined
      ? result('MDE_CONSTRUCTION_ONE_ACRE', 'MISSING_DATA', 'Determine cumulative total disturbance.', {}, MDE, 'CIVIL_ENGINEER', true)
      : acres >= 1
        ? result('MDE_CONSTRUCTION_ONE_ACRE', 'PROFESSIONAL_DETERMINATION_REQUIRED',
          'One acre or more of construction disturbance requires Maryland stormwater authorization screening.',
          { totalDisturbanceAcres: acres }, MDE, 'CIVIL_ENGINEER', true, 'Confirm NOI, SWPPP, and current general-permit coverage before disturbance.')
        : result('MDE_CONSTRUCTION_ONE_ACRE', 'NOT_APPLICABLE', 'One-acre construction stormwater trigger is not reached.',
          { totalDisturbanceAcres: acres }, MDE, 'CIVIL_ENGINEER'));

    checks.push(input.woodlandClearing
      ? result('PG_WOODLAND_CONSERVATION', input.woodlandDocumentationPresent ? 'PASS' : 'FAIL',
        'Woodland disturbance requires applicability review and TCP or exemption documentation.',
        { woodlandClearing: true, existingTcp: input.existingTcp }, MNCPPC, 'LANDSCAPE_ARCHITECT',
        !input.woodlandDocumentationPresent, input.woodlandDocumentationPresent ? undefined : 'Obtain TCP/exemption determination and account for any existing TCP.')
      : result('PG_WOODLAND_CONSERVATION', input.existingTcp ? 'WARNING' : 'NOT_APPLICABLE',
        'No proposed woodland clearing; retain any existing TCP constraints.', { existingTcp: input.existingTcp }, MNCPPC, 'LANDSCAPE_ARCHITECT'));

    checks.push(input.floodplainScreenPositive || input.wetlandOrStreamScreenPositive
      ? result('PG_ENVIRONMENTAL_CONSTRAINTS', 'PROFESSIONAL_DETERMINATION_REQUIRED',
        'Positive GIS screening requires field/official delineation and agency applicability review.',
        { floodplain: input.floodplainScreenPositive, wetlandOrStream: input.wetlandOrStreamScreenPositive },
        MNCPPC, 'ENVIRONMENTAL_PROFESSIONAL', true, 'Do not treat GIS screening as a legal delineation.')
      : result('PG_ENVIRONMENTAL_CONSTRAINTS', 'PASS', 'GIS screening did not identify these constraints; screening is not a legal delineation.',
        {}, MNCPPC, 'ENVIRONMENTAL_PROFESSIONAL'));

    checks.push(input.drivewayOrRightOfWayWork
      ? result('PG_DRIVEWAY_RIGHT_OF_WAY', 'PROFESSIONAL_DETERMINATION_REQUIRED',
        'Driveway, apron, frontage, or right-of-way work requires Site/Road applicability review.', {}, PGC_PERMITS, 'CIVIL_ENGINEER', true)
      : result('PG_DRIVEWAY_RIGHT_OF_WAY', 'NOT_APPLICABLE', 'No driveway or right-of-way work reported.', {}, PGC_PERMITS, 'CIVIL_ENGINEER'));

    const infillCandidate = input.projectType === 'RESIDENTIAL_INFILL' && (input.lotCount ?? 0) >= 1
      && (input.lotCount ?? 0) <= 6 && input.frontsExistingBuiltStreet === true;
    checks.push(infillCandidate
      ? result('PG_RESIDENTIAL_INFILL', 'PROFESSIONAL_DETERMINATION_REQUIRED',
        'One-to-six-lot project fronting an existing built street may qualify for Residential Infill Permit review.',
        { lotCount: input.lotCount }, PGC_PERMITS, 'PERMIT_SPECIALIST', false, 'Verify eligibility; do not assume the combined path applies.')
      : result('PG_RESIDENTIAL_INFILL', 'NOT_APPLICABLE', 'Reported facts do not establish the residential infill candidate path.',
        { lotCount: input.lotCount, frontsExistingBuiltStreet: input.frontsExistingBuiltStreet }, PGC_PERMITS, 'PERMIT_SPECIALIST'));

    checks.push(input.surveyVerified
      ? result('PG_SURVEY_SOURCE', 'PASS', 'Boundary/topographic source is verified.', {}, PGC_PERMITS, 'LAND_SURVEYOR')
      : result('PG_SURVEY_SOURCE', 'FAIL', 'Regulated site-plan geometry requires reliable survey data; GIS/aerial lines are not a survey.',
        {}, PGC_PERMITS, 'LAND_SURVEYOR', true, 'Obtain and verify the required Maryland survey.'));
    checks.push(input.professionalApprovalPresent
      ? result('PG_PROFESSIONAL_RELEASE', 'PASS', 'Required professional approval is recorded.', {}, PGC_PERMITS, 'LICENSED_PROFESSIONAL')
      : result('PG_PROFESSIONAL_RELEASE', 'FAIL', 'No regulated plan may be released without required licensed-professional approval.',
        {}, PGC_PERMITS, 'LICENSED_PROFESSIONAL', true));
    return checks;
  },
};

export function canLabelPermitReady(results: JurisdictionCheckResult[]): boolean {
  return !results.some((check) => check.blocksSubmission || check.outcome === 'FAIL'
    || check.outcome === 'MISSING_DATA' || check.outcome === 'PROFESSIONAL_DETERMINATION_REQUIRED');
}
