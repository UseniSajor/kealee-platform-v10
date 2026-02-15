/**
 * PERMIT TRACKER WORKER
 *
 * Claw E -- permits-compliance-claw
 *
 * Responsibilities:
 *   - Multi-jurisdiction portal status checking (DC / MD / VA)
 *   - Daily 6 AM ET cron for portal polling
 *   - Deadline monitoring with 30-day expiration warning
 *   - Phase-based permit requirement evaluation
 *
 * GUARDRAILS:
 *   - Cannot auto-file permits without explicit user trigger
 *   - Cannot modify financial records, budgets, or payments
 *   - Cannot alter schedules or contract terms
 *   - Must call assertWritable() before every Prisma write
 *
 * Queue: KEALEE_QUEUES.PERMIT_TRACKER ('kealee-permit-tracker')
 *
 * Job names:
 *   check-portal-status        -- daily cron, polls all jurisdiction portals
 *   check-deadlines            -- daily cron, flags permits expiring within 30 days
 *   evaluate-permits-for-phase -- event-driven, determines required permits per phase
 *   check-document-compliance  -- event-driven, evaluates documents against permit needs
 *   reconcile-inspection-schedule -- event-driven, alerts PM to verify inspection dates
 */

import type { PrismaClient } from '@prisma/client';
import type { KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import type { EventBus } from '@kealee/events';
import { AIProvider, PERMIT_PROMPT } from '@kealee/ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JurisdictionPortal {
  code: string;
  name: string;
  portalType: 'API_DIRECT' | 'PORTAL_SCRAPE' | 'MANUAL_ENTRY';
  apiProvider?: string;
  timezone: string;
}

interface PortalStatusResult {
  permitId: string;
  previousStatus: string;
  newStatus: string;
  jurisdictionCode: string;
  checkedAt: Date;
}

interface DeadlineAlert {
  permitId: string;
  permitType: string;
  expiresAt: Date;
  daysRemaining: number;
  projectId: string;
}

interface PhasePermitRequirement {
  type: string;
  scope: string;
  jurisdictionId?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  inspectionMilestones: string[];
}

// ---------------------------------------------------------------------------
// Portal Configurations
// ---------------------------------------------------------------------------

export const JURISDICTION_PORTALS: JurisdictionPortal[] = [
  { code: 'US-DC', name: 'District of Columbia', portalType: 'API_DIRECT', apiProvider: 'ACCELA', timezone: 'America/New_York' },
  { code: 'US-MD-MONT', name: 'Montgomery County, MD', portalType: 'API_DIRECT', apiProvider: 'ACCELA', timezone: 'America/New_York' },
  { code: 'US-MD-PG', name: "Prince George's County, MD", portalType: 'PORTAL_SCRAPE', timezone: 'America/New_York' },
  { code: 'US-VA-FAIR', name: 'Fairfax County, VA', portalType: 'API_DIRECT', apiProvider: 'TYLER', timezone: 'America/New_York' },
  { code: 'US-VA-ARL', name: 'Arlington County, VA', portalType: 'PORTAL_SCRAPE', timezone: 'America/New_York' },
  { code: 'US-VA-ALEX', name: 'City of Alexandria, VA', portalType: 'API_DIRECT', apiProvider: 'GOVOS', timezone: 'America/New_York' },
];

// Permit statuses considered "active" for portal polling
const ACTIVE_PERMIT_STATUSES = [
  'SUBMITTED', 'IN_REVIEW', 'CORRECTIONS_NEEDED', 'RESUBMITTED',
  'PLAN_REVIEW', 'UNDER_REVIEW',
];

// Expiration warning threshold in days
const EXPIRATION_WARNING_DAYS = 30;

// ---------------------------------------------------------------------------
// Portal Status Checker
// ---------------------------------------------------------------------------

/**
 * Check permit status via direct API (Accela, Tyler, GovOS).
 * Returns the remote status string or null if check fails.
 */
export async function checkPermitStatusViaApi(
  jurisdiction: { apiUrl?: string | null; apiKey?: string | null; code: string },
  permit: { id: string; permitNumber?: string | null },
): Promise<string | null> {
  if (!jurisdiction.apiUrl || !jurisdiction.apiKey || !permit.permitNumber) {
    return null;
  }

  try {
    const response = await fetch(
      `${jurisdiction.apiUrl}/permits/${permit.permitNumber}/status`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jurisdiction.apiKey}`,
          'Content-Type': 'application/json',
          'X-Kealee-Source': 'permits-compliance-claw',
        },
        signal: AbortSignal.timeout(15_000), // 15s timeout per portal call
      },
    );

    if (!response.ok) {
      console.warn(
        `[permit-tracker] API ${response.status} for permit ${permit.id} in ${jurisdiction.code}`,
      );
      return null;
    }

    const data = (await response.json()) as { status?: string; permitStatus?: string };
    return data.status ?? data.permitStatus ?? null;
  } catch (err) {
    console.error(`[permit-tracker] API error for ${jurisdiction.code}:`, err);
    return null;
  }
}

/**
 * Check permit status via portal scraping (headless browser).
 * This is a stub -- actual implementation uses Puppeteer infrastructure.
 */
export async function checkPermitStatusViaScrape(
  jurisdiction: { portalUrl?: string | null; code: string },
  permit: { id: string; permitNumber?: string | null },
): Promise<string | null> {
  if (!jurisdiction.portalUrl || !permit.permitNumber) {
    return null;
  }

  try {
    // Puppeteer-based scraping would go here.
    // The actual scraper is provided by @kealee/integrations and runs
    // in a sandboxed headless browser environment.
    console.log(
      `[permit-tracker] Portal scrape for ${permit.id} in ${jurisdiction.code} -- stub`,
    );
    return null;
  } catch (err) {
    console.error(`[permit-tracker] Scrape error for ${jurisdiction.code}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Deadline Monitor
// ---------------------------------------------------------------------------

/**
 * Query all permits that expire within the warning threshold and return
 * structured deadline alerts.
 */
export async function findExpiringPermits(
  prisma: PrismaClient,
  warningDays: number = EXPIRATION_WARNING_DAYS,
): Promise<DeadlineAlert[]> {
  const threshold = new Date(Date.now() + warningDays * 86_400_000);

  const permits = await prisma.permit.findMany({
    where: {
      status: { in: ['APPROVED', 'ISSUED'] },
      expiresAt: { lte: threshold, gt: new Date() },
    },
    select: {
      id: true,
      permitType: true,
      expiresAt: true,
      projectId: true,
    },
  });

  return permits.map((p) => ({
    permitId: p.id,
    permitType: p.permitType,
    expiresAt: p.expiresAt as unknown as Date,
    daysRemaining: Math.ceil(
      ((p.expiresAt as unknown as Date).getTime() - Date.now()) / 86_400_000,
    ),
    projectId: p.projectId,
  }));
}

// ---------------------------------------------------------------------------
// Phase-to-Permit Evaluation
// ---------------------------------------------------------------------------

/**
 * Mapping of construction phases to commonly required permit types.
 * Used as a baseline; AI augments with jurisdiction-specific requirements.
 */
export const PHASE_PERMIT_MAP: Record<string, string[]> = {
  PRE_CONSTRUCTION: ['DEMOLITION', 'GRADING', 'SEDIMENT_CONTROL', 'TREE_REMOVAL'],
  FOUNDATION: ['BUILDING', 'PLUMBING'],
  FRAMING: ['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL'],
  MECHANICAL: ['ELECTRICAL', 'PLUMBING', 'HVAC', 'GAS', 'FIRE_SPRINKLER'],
  FINISHING: ['BUILDING', 'FIRE_PROTECTION', 'ELEVATOR'],
  CLOSEOUT: ['CERTIFICATE_OF_OCCUPANCY', 'FIRE_MARSHAL_FINAL'],
};

/**
 * Determine required inspections for a given permit type.
 */
export const PERMIT_INSPECTION_MAP: Record<string, string[]> = {
  BUILDING: ['FOUNDATION', 'FRAMING', 'INSULATION', 'DRYWALL', 'FINAL'],
  ELECTRICAL: ['ROUGH_IN', 'UNDERGROUND', 'FINAL'],
  PLUMBING: ['UNDERGROUND', 'ROUGH_IN', 'WATER_TEST', 'FINAL'],
  MECHANICAL: ['ROUGH_IN', 'FINAL'],
  FIRE_SPRINKLER: ['ROUGH_IN', 'HYDROSTATIC', 'FINAL'],
  GRADING: ['PRE_CONSTRUCTION', 'STABILIZATION', 'FINAL'],
};
