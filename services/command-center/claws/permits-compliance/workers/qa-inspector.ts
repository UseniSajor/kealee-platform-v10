/**
 * QA INSPECTOR WORKER
 *
 * Claw E -- permits-compliance-claw
 *
 * Responsibilities:
 *   - Claude Vision AI photo analysis for quality and safety
 *   - Compliance checks against permit requirements
 *   - Pass / fail recording (THIS CLAW OWNS INSPECTION PASS/FAIL AUTHORITY)
 *   - Quality issue creation and tracking
 *
 * GUARDRAILS:
 *   - Cannot auto-file permits without explicit user trigger
 *   - Cannot modify financial records, budgets, or payments
 *   - Cannot alter schedules or contract terms
 *   - Must call assertWritable() before every Prisma write
 *
 * Queue: KEALEE_QUEUES.QA_INSPECTOR ('kealee-qa-inspector')
 *
 * Job names:
 *   analyze-photo          -- AI Vision analysis of construction site photos
 *   run-compliance-check   -- full compliance evaluation for an inspection
 *   record-result          -- record inspection pass/fail with findings
 */

import type { PrismaClient } from '@prisma/client';
import type { KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import type { EventBus } from '@kealee/events';
import { AIProvider, PERMIT_PROMPT } from '@kealee/ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhotoAnalysisResult {
  issues: PhotoIssue[];
  overallScore: number;
  safetyPass: boolean;
  summary: string;
}

export interface PhotoIssue {
  type: 'WORKMANSHIP' | 'MATERIAL' | 'SAFETY' | 'CODE_VIOLATION';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';
  description: string;
  location?: string;
  codeReference?: string;
  requiredAction?: string;
}

export interface ComplianceResult {
  passed: boolean;
  deficiencies: string[];
  notes: string;
  recommendations: string[];
}

export interface InspectionResultInput {
  inspectionId: string;
  projectId: string;
  organizationId: string | null;
  result: 'PASSED' | 'FAILED';
  findings?: InspectionFindingInput[];
  notes?: string;
}

export interface InspectionFindingInput {
  type: string;
  severity: string;
  description: string;
  location?: string;
  photos?: string[];
  requiredAction?: string;
}

// ---------------------------------------------------------------------------
// Severity weights for compliance scoring
// ---------------------------------------------------------------------------

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 40,
  MAJOR: 20,
  MODERATE: 10,
  MINOR: 5,
};

// Maximum deduction before auto-fail
const FAIL_THRESHOLD = 30;

// ---------------------------------------------------------------------------
// Photo Analysis Utilities
// ---------------------------------------------------------------------------

/**
 * Compute a weighted quality score from a list of issues.
 * Starts at 100 and deducts based on severity.
 */
export function computeQualityScore(issues: PhotoIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    score -= SEVERITY_WEIGHTS[issue.severity] ?? 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine if a photo passes safety review.
 * Any CRITICAL safety issue or more than one MAJOR safety issue fails.
 */
export function evaluateSafetyPass(issues: PhotoIssue[]): boolean {
  const safetyIssues = issues.filter((i) => i.type === 'SAFETY');
  const hasCritical = safetyIssues.some((i) => i.severity === 'CRITICAL');
  const majorCount = safetyIssues.filter((i) => i.severity === 'MAJOR').length;

  return !hasCritical && majorCount <= 1;
}

/**
 * Classify issues by type for reporting.
 */
export function classifyIssues(issues: PhotoIssue[]): Record<string, PhotoIssue[]> {
  const classified: Record<string, PhotoIssue[]> = {
    WORKMANSHIP: [],
    MATERIAL: [],
    SAFETY: [],
    CODE_VIOLATION: [],
  };

  for (const issue of issues) {
    if (classified[issue.type]) {
      classified[issue.type].push(issue);
    }
  }

  return classified;
}

// ---------------------------------------------------------------------------
// Compliance Evaluation Utilities
// ---------------------------------------------------------------------------

/**
 * Evaluate inspection findings against compliance criteria.
 * Used as a pre-check before AI analysis adds context.
 *
 * Pass criteria:
 *   - No CRITICAL findings in OPEN status
 *   - No more than 2 MAJOR findings in OPEN status
 *   - All safety-related findings resolved or mitigated
 *
 * Fail criteria:
 *   - Any unresolved CRITICAL finding
 *   - More than 2 unresolved MAJOR findings
 *   - Any unresolved safety violation
 */
export function evaluateComplianceRules(
  findings: Array<{
    type: string;
    severity: string;
    status: string;
  }>,
): { passed: boolean; reasons: string[] } {
  const openFindings = findings.filter((f) => f.status === 'OPEN');
  const reasons: string[] = [];

  // Check for unresolved CRITICAL findings
  const criticalOpen = openFindings.filter((f) => f.severity === 'CRITICAL');
  if (criticalOpen.length > 0) {
    reasons.push(`${criticalOpen.length} unresolved CRITICAL finding(s)`);
  }

  // Check for too many unresolved MAJOR findings
  const majorOpen = openFindings.filter((f) => f.severity === 'MAJOR');
  if (majorOpen.length > 2) {
    reasons.push(`${majorOpen.length} unresolved MAJOR findings (max 2 allowed)`);
  }

  // Check for unresolved safety violations
  const safetyOpen = openFindings.filter(
    (f) => f.type === 'SAFETY' || f.type === 'CODE_VIOLATION',
  );
  if (safetyOpen.length > 0) {
    reasons.push(`${safetyOpen.length} unresolved safety/code violation(s)`);
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Default finding due date calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the due date for a finding based on severity.
 * CRITICAL: 3 days, MAJOR: 7 days, MODERATE: 14 days, MINOR: 30 days
 */
export function calculateFindingDueDate(severity: string): Date {
  const daysMap: Record<string, number> = {
    CRITICAL: 3,
    MAJOR: 7,
    MODERATE: 14,
    MINOR: 30,
  };

  const days = daysMap[severity] ?? 14;
  return new Date(Date.now() + days * 86_400_000);
}

// ---------------------------------------------------------------------------
// Inspection Type to Code Section Mapping
// ---------------------------------------------------------------------------

/**
 * Map inspection types to commonly referenced code sections.
 * Used to provide code references in findings.
 */
export const INSPECTION_CODE_REFERENCES: Record<string, string[]> = {
  FOUNDATION: [
    'IBC 1809 - Shallow Foundations',
    'IBC 1810 - Deep Foundations',
    'IRC R403 - Footings',
  ],
  FRAMING: [
    'IBC 2304 - Wood Construction',
    'IBC 2205 - Steel Construction',
    'IRC R602 - Wall Construction',
  ],
  ELECTRICAL_ROUGH: [
    'NEC Article 210 - Branch Circuits',
    'NEC Article 310 - Conductors',
    'NEC Article 334 - NM Cable',
  ],
  PLUMBING_ROUGH: [
    'IPC Chapter 3 - General Regulations',
    'IPC Chapter 7 - Sanitary Drainage',
    'IRC P2503 - Inspection and Tests',
  ],
  MECHANICAL_ROUGH: [
    'IMC Chapter 3 - General Regulations',
    'IMC Chapter 6 - Duct Systems',
    'IRC M1411 - Refrigerant System',
  ],
  INSULATION: [
    'IECC C402 - Building Thermal Envelope',
    'IECC R402 - Building Thermal Envelope (Residential)',
  ],
  FIRE_PROTECTION: [
    'IBC Chapter 7 - Fire and Smoke Protection',
    'NFPA 13 - Sprinkler Systems',
    'NFPA 72 - Fire Alarm Systems',
  ],
  FINAL: [
    'IBC 110 - Certificate of Occupancy',
    'IBC 3412 - Existing Buildings',
    'IFC Chapter 9 - Fire Protection Systems',
  ],
};
