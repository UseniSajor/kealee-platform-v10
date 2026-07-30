import type { RuleNode } from './rule-engine'

/**
 * The 15 Prince George's County checks migrated from the retired hardcoded
 * `princeGeorgesCountyRulePack` (see __fixtures__/prince-georges-legacy.ts) into DSL data.
 *
 * NOT migrated here, by design (see rule-engine.ts module doc):
 *   - PG_PROFESSIONAL_RELEASE
 *   - PG_SIGNED_SEALED_PLOT_PLAN
 * Both are "does a seal exist" checks — handled exclusively by evaluateProfessionalRelease /
 * submitSitePlanToJurisdiction, never as a jurisdiction CHECK row.
 *
 * This module is the single source of truth for the rule content: Phase 0's tests assert
 * against it directly, and the Phase 3 migration's SQL is generated from it (not hand-copied),
 * so there is no transcription drift between the tested logic and what ships to the database.
 */

export const PGC_AUTHORITY = {
  agency: "Prince George's County Department of Permitting, Inspections and Enforcement",
  sourceTitle: 'Site/Road Plan Review and Residential Building Permit requirements',
  sourceUrl: 'https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement',
}
export const PGSCD_AUTHORITY = {
  agency: "Prince George's Soil Conservation District",
  sourceTitle: 'Erosion and sediment control plan review',
  sourceUrl: 'https://www.pgscd.org/',
}
export const MNCPPC_AUTHORITY = {
  agency: 'M-NCPPC Prince George’s County Planning Department',
  sourceTitle: 'Environmental Planning and woodland conservation',
  sourceUrl: 'https://www.pgplanning.org/',
}
export const MDE_AUTHORITY = {
  agency: 'Maryland Department of the Environment',
  sourceTitle: 'General Permit for Stormwater Associated with Construction Activity',
  sourceUrl: 'https://mde.maryland.gov/programs/water/StormwaterManagementProgram/Pages/storm_gen_permit.aspx',
}

export const VERIFIED_DATE = '2026-07-21'

export interface PgcRuleDefinition {
  ruleKey: string
  projectTypes: string[]
  permitTypes: string[]
  authority: { agency: string; sourceTitle: string; sourceUrl: string }
  logic: RuleNode
}

export const PGC_RULES: PgcRuleDefinition[] = [
  {
    ruleKey: 'PG_LAND_DISTURBANCE_5000',
    projectTypes: [],
    permitTypes: ['SEDIMENT_CONTROL'],
    authority: PGSCD_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'landDisturbanceSqFt' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Determine total land disturbance.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'gt', field: 'landDisturbanceSqFt', value: 5000 },
        then: {
          type: 'branch',
          if: { op: 'eq', field: 'sedimentControlPlanPresent', value: true },
          then: { type: 'leaf', outcome: 'PASS',
            requirement: 'Disturbance over 5,000 square feet requires sediment-control review and applicable approval/green stamp.',
            blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['landDisturbanceSqFt'] },
          else: { type: 'leaf', outcome: 'FAIL',
            requirement: 'Disturbance over 5,000 square feet requires sediment-control review and applicable approval/green stamp.',
            blocksSubmission: true, remediation: 'Prepare and obtain approval of the sediment-control plan.',
            responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['landDisturbanceSqFt'] },
        },
        else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
          requirement: '5,000-square-foot disturbance trigger is not exceeded.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['landDisturbanceSqFt'] },
      },
    },
  },
  {
    ruleKey: 'PG_EARTH_MOVEMENT_100_CY',
    projectTypes: [],
    permitTypes: ['GRADING'],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'earthMovementCubicYards' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Calculate cut and fill volume.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'gt', field: 'earthMovementCubicYards', value: 100 },
        then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
          requirement: 'Earth movement over 100 cubic yards triggers grading/site review screening.',
          blocksSubmission: true, remediation: 'Licensed civil engineer must confirm the grading permit path and design.',
          responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['earthMovementCubicYards'] },
        else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
          requirement: '100-cubic-yard screening threshold is not exceeded.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['earthMovementCubicYards'] },
      },
    },
  },
  {
    ruleKey: 'MDE_CONSTRUCTION_ONE_ACRE',
    projectTypes: [],
    permitTypes: ['GRADING'],
    authority: MDE_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'totalDisturbanceAcres' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Determine cumulative total disturbance.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'gte', field: 'totalDisturbanceAcres', value: 1 },
        then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
          requirement: 'One acre or more of construction disturbance requires Maryland stormwater authorization screening.',
          blocksSubmission: true, remediation: 'Confirm NOI, SWPPP, and current general-permit coverage before disturbance.',
          responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['totalDisturbanceAcres'] },
        else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
          requirement: 'One-acre construction stormwater trigger is not reached.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['totalDisturbanceAcres'] },
      },
    },
  },
  {
    ruleKey: 'PG_WOODLAND_CONSERVATION',
    projectTypes: [],
    permitTypes: [],
    authority: MNCPPC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'eq', field: 'woodlandClearing', value: true },
      then: {
        type: 'branch',
        if: { op: 'eq', field: 'woodlandDocumentationPresent', value: true },
        then: { type: 'leaf', outcome: 'PASS',
          requirement: 'Woodland disturbance requires applicability review and TCP or exemption documentation.',
          blocksSubmission: false, responsibleDiscipline: 'LANDSCAPE_ARCHITECT' },
        else: { type: 'leaf', outcome: 'FAIL',
          requirement: 'Woodland disturbance requires applicability review and TCP or exemption documentation.',
          blocksSubmission: true, remediation: 'Obtain TCP/exemption determination and account for any existing TCP.',
          responsibleDiscipline: 'LANDSCAPE_ARCHITECT' },
      },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'existingTcp', value: true },
        then: { type: 'leaf', outcome: 'WARNING',
          requirement: 'No proposed woodland clearing; retain any existing TCP constraints.',
          blocksSubmission: false, responsibleDiscipline: 'LANDSCAPE_ARCHITECT', includeInputs: ['existingTcp'] },
        else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
          requirement: 'No proposed woodland clearing; retain any existing TCP constraints.',
          blocksSubmission: false, responsibleDiscipline: 'LANDSCAPE_ARCHITECT', includeInputs: ['existingTcp'] },
      },
    },
  },
  {
    ruleKey: 'PG_ENVIRONMENTAL_CONSTRAINTS',
    projectTypes: [],
    permitTypes: [],
    authority: MNCPPC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'or', terms: [
        { op: 'eq', field: 'floodplainScreenPositive', value: true },
        { op: 'eq', field: 'wetlandOrStreamScreenPositive', value: true },
      ] },
      then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
        requirement: 'Positive GIS screening requires field/official delineation and agency applicability review.',
        blocksSubmission: true, remediation: 'Do not treat GIS screening as a legal delineation.',
        responsibleDiscipline: 'ENVIRONMENTAL_PROFESSIONAL',
        includeInputs: ['floodplainScreenPositive', 'wetlandOrStreamScreenPositive'] },
      else: { type: 'leaf', outcome: 'PASS',
        requirement: 'GIS screening did not identify these constraints; screening is not a legal delineation.',
        blocksSubmission: false, responsibleDiscipline: 'ENVIRONMENTAL_PROFESSIONAL' },
    },
  },
  {
    ruleKey: 'PG_DRIVEWAY_RIGHT_OF_WAY',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'eq', field: 'drivewayOrRightOfWayWork', value: true },
      then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
        requirement: 'Driveway, apron, frontage, or right-of-way work requires Site/Road applicability review.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
        requirement: 'No driveway or right-of-way work reported.',
        blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER' },
    },
  },
  {
    ruleKey: 'PG_RESIDENTIAL_INFILL',
    // Not scoped by projectTypes: the legacy pack always evaluates this check for every
    // project type — the RESIDENTIAL_INFILL eligibility test is inside the condition tree
    // itself (an `and` term), not a query-level filter. Scoping it here would make the
    // finding disappear entirely for non-infill projects instead of correctly returning
    // NOT_APPLICABLE for them.
    projectTypes: [],
    permitTypes: ['BUILDING'],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'and', terms: [
        { op: 'eq', field: 'projectType', value: 'RESIDENTIAL_INFILL' },
        { op: 'gte', field: 'lotCount', value: 1 },
        { op: 'lte', field: 'lotCount', value: 6 },
        { op: 'eq', field: 'frontsExistingBuiltStreet', value: true },
      ] },
      then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
        requirement: 'One-to-six-lot project fronting an existing built street may qualify for Residential Infill Permit review.',
        blocksSubmission: false, remediation: 'Verify eligibility; do not assume the combined path applies.',
        responsibleDiscipline: 'PERMIT_SPECIALIST', includeInputs: ['lotCount'] },
      else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
        requirement: 'Reported facts do not establish the residential infill candidate path.',
        blocksSubmission: false, responsibleDiscipline: 'PERMIT_SPECIALIST',
        includeInputs: ['lotCount', 'frontsExistingBuiltStreet'] },
    },
  },
  {
    ruleKey: 'PG_SURVEY_SOURCE',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'eq', field: 'surveyVerified', value: true },
      then: { type: 'leaf', outcome: 'PASS', requirement: 'Boundary/topographic source is verified.',
        blocksSubmission: false, responsibleDiscipline: 'LAND_SURVEYOR' },
      else: { type: 'leaf', outcome: 'FAIL',
        requirement: 'Regulated site-plan geometry requires reliable survey data; GIS/aerial lines are not a survey.',
        blocksSubmission: true, remediation: 'Obtain and verify the required Maryland survey.',
        responsibleDiscipline: 'LAND_SURVEYOR' },
    },
  },
  {
    ruleKey: 'PG_MUNICIPALITY_RESOLUTION',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'municipalityResolved' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Resolve municipal or County authority.',
        blocksSubmission: true, responsibleDiscipline: 'PERMIT_SPECIALIST' },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'municipalityResolved', value: true },
        then: { type: 'leaf', outcome: 'PASS', requirement: 'The reviewing municipality/County authority must be resolved.',
          blocksSubmission: false, responsibleDiscipline: 'PERMIT_SPECIALIST' },
        else: { type: 'leaf', outcome: 'FAIL', requirement: 'The reviewing municipality/County authority must be resolved.',
          blocksSubmission: true, responsibleDiscipline: 'PERMIT_SPECIALIST' },
      },
    },
  },
  {
    ruleKey: 'PG_ZONING_USE',
    projectTypes: [],
    permitTypes: [],
    authority: MNCPPC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'zoningUseAllowed' },
      then: { type: 'leaf', outcome: 'MISSING_DATA',
        requirement: 'Resolve exact zoning, overlays and proposed residential use.',
        blocksSubmission: true, responsibleDiscipline: 'LAND_PLANNER' },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'zoningUseAllowed', value: true },
        then: { type: 'leaf', outcome: 'PASS',
          requirement: 'Proposed residential use and dimensional standards must comply with current zoning.',
          blocksSubmission: false, responsibleDiscipline: 'LAND_PLANNER' },
        else: { type: 'leaf', outcome: 'FAIL',
          requirement: 'Proposed residential use and dimensional standards must comply with current zoning.',
          blocksSubmission: true, remediation: 'Revise the concept or obtain applicable zoning relief.',
          responsibleDiscipline: 'LAND_PLANNER' },
      },
    },
  },
  {
    ruleKey: 'PG_WATER_SEWER_SERVICE',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'and', terms: [
        { op: 'missing', field: 'publicWaterSewerAvailable' },
        { op: 'missing', field: 'wellSepticApprovalPresent' },
      ] },
      then: { type: 'leaf', outcome: 'MISSING_DATA',
        requirement: 'Resolve public water/sewer category or well/septic path.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'or', terms: [
          { op: 'eq', field: 'publicWaterSewerAvailable', value: true },
          { op: 'eq', field: 'wellSepticApprovalPresent', value: true },
        ] },
        then: { type: 'leaf', outcome: 'PASS', requirement: 'Establish a feasible water and wastewater service path.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER',
          includeInputs: ['publicWaterSewerAvailable', 'wellSepticApprovalPresent'] },
        else: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
          requirement: 'Establish a feasible water and wastewater service path.',
          blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER',
          includeInputs: ['publicWaterSewerAvailable', 'wellSepticApprovalPresent'] },
      },
    },
  },
  {
    ruleKey: 'PG_GRADE_CHANGE',
    projectTypes: [],
    permitTypes: ['GRADING'],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'gradeChangeFeet' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Calculate maximum proposed grade change.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'neq', field: 'gradeChangeFeet', value: 0 },
        then: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
          requirement: 'Proposed grade changes require grading, drainage and permit-path review.',
          blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['gradeChangeFeet'] },
        else: { type: 'leaf', outcome: 'NOT_APPLICABLE',
          requirement: 'Proposed grade changes require grading, drainage and permit-path review.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER', includeInputs: ['gradeChangeFeet'] },
      },
    },
  },
  {
    ruleKey: 'PG_STORM_DRAIN_PLAN',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'eq', field: 'stormDrainPlanRequired', value: true },
      then: {
        type: 'branch',
        if: { op: 'eq', field: 'stormDrainPlanPresent', value: true },
        then: { type: 'leaf', outcome: 'PASS',
          requirement: 'Provide the storm-drain plan when required by the resolved design and review path.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER' },
        else: { type: 'leaf', outcome: 'FAIL',
          requirement: 'Provide the storm-drain plan when required by the resolved design and review path.',
          blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'stormDrainPlanRequired', value: false },
        then: { type: 'leaf', outcome: 'NOT_APPLICABLE', requirement: 'Determine storm-drain plan applicability.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER' },
        else: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Determine storm-drain plan applicability.',
          blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      },
    },
  },
  {
    ruleKey: 'PG_UTILITY_CONFLICTS',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'utilityConflictsResolved' },
      then: { type: 'leaf', outcome: 'MISSING_DATA', requirement: 'Screen utility connections and conflicts.',
        blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'utilityConflictsResolved', value: true },
        then: { type: 'leaf', outcome: 'PASS', requirement: 'Utility conflicts and service routes must be resolved.',
          blocksSubmission: false, responsibleDiscipline: 'CIVIL_ENGINEER' },
        else: { type: 'leaf', outcome: 'FAIL', requirement: 'Utility conflicts and service routes must be resolved.',
          blocksSubmission: true, responsibleDiscipline: 'CIVIL_ENGINEER' },
      },
    },
  },
  {
    ruleKey: 'PG_CONCEPT_APPROVAL',
    projectTypes: [],
    permitTypes: [],
    authority: PGC_AUTHORITY,
    logic: {
      type: 'branch',
      if: { op: 'missing', field: 'conceptApprovalPresent' },
      then: { type: 'leaf', outcome: 'MISSING_DATA',
        requirement: 'Determine and record applicable concept approval.',
        blocksSubmission: true, responsibleDiscipline: 'PERMIT_SPECIALIST' },
      else: {
        type: 'branch',
        if: { op: 'eq', field: 'conceptApprovalPresent', value: true },
        then: { type: 'leaf', outcome: 'PASS',
          requirement: 'Required site/stormwater concept approval must be recorded before submission.',
          blocksSubmission: false, responsibleDiscipline: 'PERMIT_SPECIALIST' },
        else: { type: 'leaf', outcome: 'PROFESSIONAL_DETERMINATION_REQUIRED',
          requirement: 'Required site/stormwater concept approval must be recorded before submission.',
          blocksSubmission: true, responsibleDiscipline: 'PERMIT_SPECIALIST' },
      },
    },
  },
]
