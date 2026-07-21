import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const Input = z.object({
  address: z.string().min(5).optional(),
  permitNumber: z.string().optional(),
  jurisdictionCode: z.string().optional(),
}).refine(
  (data) => data.address || data.permitNumber,
  { message: "Either address or permitNumber must be provided" }
);

type In = z.infer<typeof Input>;

export interface PermitStatusResult {
  permitNumber?: string;
  address: string;
  jurisdictionCode: string;
  jurisdiction: string;
  permitPortalUrl: string;
  permitPortalName: string;
  permitStatusUrl: string;
  planUploadSystem: string;
  status: "unknown" | "not_filed" | "under_review" | "approved" | "issued" | "expired" | "revoked" | "closed";
  statusSummary: string;
  filedDate?: string;
  issuedDate?: string;
  expirationDate?: string;
  reviewNotes: string[];
  nextSteps: string[];
  riskFlags: string[];
  source: "live" | "ai" | "stub";
  confidence: "high" | "medium" | "low";
  note?: string;
}

// ─── Jurisdiction lookup table ─────────────────────────────────────────────────
// Mirrors dmv.jurisdictions.seed.ts — keep in sync when adding jurisdictions

interface JurisdictionPortalInfo {
  name: string;
  permitPortalName: string;
  permitPortalUrl: string;
  permitStatusUrl: string;
  planUploadSystem: string;
  inspectionUrl: string;
}

// Keep in sync with packages/seeds/src/jurisdictions/dmv.jurisdictions.seed.ts
// Verified 2026-03-24 via AI research (training data Aug 2025) — re-verify annually
const JURISDICTION_PORTALS: Record<string, JurisdictionPortalInfo> = {
  dc: {
    name: "District of Columbia",
    permitPortalName: "DC Self Service Portal (Accela)",
    permitPortalUrl: "https://permitsdc.dc.gov",
    permitStatusUrl: "https://permitsdc.dc.gov",
    planUploadSystem: "ProjectDox (eplans.dc.gov)",
    inspectionUrl: "https://permitsdc.dc.gov",
  },
  montgomery_md: {
    name: "Montgomery County, MD",
    permitPortalName: "DPS Customer Portal (Accela)",
    permitPortalUrl: "https://permittingservices.montgomerycountymd.gov",
    permitStatusUrl: "https://permittingservices.montgomerycountymd.gov",
    planUploadSystem: "ProjectDox via DPS Customer Portal",
    inspectionUrl: "https://permittingservices.montgomerycountymd.gov",
  },
  prince_georges_md: {
    name: "Prince George's County, MD",
    permitPortalName: "DPIE Accela Portal",
    permitPortalUrl: "https://dpie.mypgc.us",
    permitStatusUrl: "https://dpie.mypgc.us",
    planUploadSystem: "ProjectDox (eplans.mypgc.us)",
    inspectionUrl: "https://dpie.mypgc.us",
  },
  fairfax_va: {
    name: "Fairfax County, VA",
    permitPortalName: "FIDO (Fairfax Integrated Development Online)",
    permitPortalUrl: "https://permit.fairfaxcounty.gov",
    permitStatusUrl: "https://permit.fairfaxcounty.gov",
    planUploadSystem: "FIDO / ProjectDox (permit.fairfaxcounty.gov)",
    inspectionUrl: "https://permit.fairfaxcounty.gov",
  },
  arlington_va: {
    name: "Arlington County, VA",
    permitPortalName: "Arlington Permit Center Online (Accela)",
    permitPortalUrl: "https://permit.arlingtonva.us",
    permitStatusUrl: "https://permit.arlingtonva.us",
    planUploadSystem: "ProjectDox (eplans.arlingtonva.us)",
    inspectionUrl: "https://permit.arlingtonva.us",
  },
  alexandria_va: {
    name: "City of Alexandria, VA",
    permitPortalName: "Accela Citizen Access (ACA)",
    permitPortalUrl: "https://aca.alexandriava.gov",
    permitStatusUrl: "https://aca.alexandriava.gov",
    planUploadSystem: "ProjectDox (eplans.alexandriava.gov)",
    inspectionUrl: "https://aca.alexandriava.gov",
  },
  loudoun_va: {
    name: "Loudoun County, VA",
    permitPortalName: "EnerGov (Tyler Technologies)",
    permitPortalUrl: "https://energov.loudoun.gov",
    permitStatusUrl: "https://energov.loudoun.gov",
    planUploadSystem: "EnerGov CSS (integrated, energov.loudoun.gov)",
    inspectionUrl: "https://energov.loudoun.gov",
  },
};

// Reuse the address-based jurisdiction detection from check-zoning.tool.ts pattern
function detectJurisdictionCode(address: string): string {
  const a = address.toLowerCase();
  if (a.includes(", dc") || a.includes("washington, d.c") || a.includes("washington dc") || a.match(/\bdc\b/)) return "dc";
  if (a.includes("montgomery county") || (a.includes(", md") && (a.includes("rockville") || a.includes("bethesda") || a.includes("silver spring") || a.includes("gaithersburg") || a.includes("germantown")))) return "montgomery_md";
  if (a.includes("prince george") || (a.includes(", md") && (a.includes("hyattsville") || a.includes("college park") || a.includes("bowie") || a.includes("laurel") || a.includes("greenbelt")))) return "prince_georges_md";
  if (a.includes("fairfax") || (a.includes(", va") && (a.includes("reston") || a.includes("herndon") || a.includes("mclean") || a.includes("annandale") || a.includes("springfield")))) return "fairfax_va";
  if (a.includes("arlington") && a.includes("va")) return "arlington_va";
  if (a.includes("alexandria") && a.includes("va")) return "alexandria_va";
  if (a.includes("loudoun") || (a.includes(", va") && (a.includes("leesburg") || a.includes("ashburn") || a.includes("sterling") || a.includes("purcellville")))) return "loudoun_va";
  return "unknown";
}

export const getPermitStatusTool: ToolDefinition<In, PermitStatusResult> = {
  name: "get_permit_status",
  description:
    "Looks up permit status and review context for a given address or permit number. Returns filing status, review stage, next steps, risk flags, and jurisdiction-specific portal links for each of the 7 supported DMV jurisdictions.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["permits", "status", "intake", "jurisdiction"],

  async execute(input: In, context: ToolContext): Promise<PermitStatusResult> {
    // Resolve jurisdiction
    const jurisdictionCode =
      input.jurisdictionCode ??
      (input.address ? detectJurisdictionCode(input.address) : "unknown");

    const portal = JURISDICTION_PORTALS[jurisdictionCode];
    const resolvedAddress = input.address ?? `Permit #${input.permitNumber}`;

    const base: Omit<PermitStatusResult, "status" | "statusSummary" | "reviewNotes" | "nextSteps" | "riskFlags" | "source" | "confidence" | "note"> = {
      permitNumber: input.permitNumber,
      address: resolvedAddress,
      jurisdictionCode,
      jurisdiction: portal?.name ?? "Unknown Jurisdiction",
      permitPortalUrl: portal?.permitPortalUrl ?? "",
      permitPortalName: portal?.permitPortalName ?? "Unknown Portal",
      permitStatusUrl: portal?.permitStatusUrl ?? "",
      planUploadSystem: portal?.planUploadSystem ?? "Unknown",
    };

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey && portal) {
      const client = new Anthropic({ apiKey: anthropicKey });

      const prompt = `You are a permit status analyst for ${portal.name}.

The user is checking permit status for:
- Address: ${resolvedAddress}${input.permitNumber ? `\n- Permit Number: ${input.permitNumber}` : ""}
- Jurisdiction: ${portal.name}
- Permit portal: ${portal.permitPortalName} (${portal.permitPortalUrl})
- Status lookup: ${portal.permitStatusUrl}
- Plan upload system: ${portal.planUploadSystem}

Based on typical ${portal.name} permit processes and what you know about this jurisdiction, provide a JSON status analysis:
{
  "status": "unknown|not_filed|under_review|approved|issued|expired|revoked|closed",
  "statusSummary": "plain English status description",
  "filedDate": "ISO date string or null",
  "issuedDate": "ISO date string or null",
  "expirationDate": "ISO date string or null",
  "reviewNotes": ["array of review notes relevant to this jurisdiction and project type"],
  "nextSteps": ["array of actionable next steps for the applicant"],
  "riskFlags": ["array of relevant risk flags"],
  "confidence": "high|medium|low"
}

Important notes for ${portal.name}:
- Status is not available in real-time — set status to "unknown" if no permit number provided
- Direct the user to ${portal.permitStatusUrl} for live status
- Include jurisdiction-specific review notes (typical turnaround, common comment types, etc.)
- Respond ONLY with valid JSON, no other text.`;

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
        const parsed = JSON.parse(text) as Partial<PermitStatusResult>;

        // Bubble risk flags into session memory
        for (const flag of parsed.riskFlags ?? []) {
          if (!context.memory.riskFlags.includes(flag)) {
            context.memory.riskFlags.push(flag);
          }
        }

        return {
          ...base,
          status: parsed.status ?? "unknown",
          statusSummary: parsed.statusSummary ?? `Status unknown — check ${portal.permitPortalName} directly.`,
          filedDate: parsed.filedDate,
          issuedDate: parsed.issuedDate,
          expirationDate: parsed.expirationDate,
          reviewNotes: parsed.reviewNotes ?? [],
          nextSteps: parsed.nextSteps ?? [`Check status at ${portal.permitStatusUrl}`],
          riskFlags: parsed.riskFlags ?? [],
          source: "ai",
          confidence: (parsed.confidence as "high" | "medium" | "low") ?? "low",
          note: `AI-generated analysis for ${portal.name}. Verify at: ${portal.permitStatusUrl}`,
        };
      } catch (err) {
        console.warn("[get_permit_status] AI call failed, using stub:", err);
      }
    }

    // Stub fallback — always useful: gives user the right portal link
    const statusNote = portal
      ? `Status not available via Kealee API. Check live status at: ${portal.permitStatusUrl}`
      : "Jurisdiction not supported. Please check your local building department.";

    return {
      ...base,
      status: "unknown",
      statusSummary: statusNote,
      reviewNotes: portal
        ? [
            `${portal.name} uses ${portal.permitPortalName} for permit applications and status.`,
            `Plan submissions go through ${portal.planUploadSystem}.`,
          ]
        : ["Jurisdiction outside Kealee's supported DMV market."],
      nextSteps: portal
        ? [
            `Check permit status at: ${portal.permitStatusUrl}`,
            `For new applications, visit: ${portal.permitPortalUrl}`,
            `Schedule inspections at: ${portal.inspectionUrl ?? portal.permitPortalUrl}`,
          ]
        : ["Contact your local building department directly."],
      riskFlags: [],
      source: "stub",
      confidence: "low",
      note: input.permitNumber
        ? `Set ANTHROPIC_API_KEY for AI analysis. Live permit lookup requires integration with ${portal?.permitPortalName ?? "jurisdiction portal"}.`
        : "Provide a permit number for more specific status lookup.",
    };
  },
};
