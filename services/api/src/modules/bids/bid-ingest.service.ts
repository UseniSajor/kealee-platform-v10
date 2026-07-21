import { prismaAny } from '../../utils/prisma-helper'
import { bidService } from './bid.service'

// ── Types ───────────────────────────────────────────────────────────────────

export interface RawEmail {
  from: string
  subject: string
  body: string
  receivedAt?: string
  messageId?: string
}

export interface ParsedBidData {
  projectName: string
  source: string
  sourceId?: string
  sourceUrl?: string
  projectNumber?: string
  description?: string
  scope?: string
  location?: string
  county?: string
  state?: string
  ownerName?: string
  gcName?: string
  contactName?: string
  contactEmail?: string
  estimatedValue?: number
  dueDate?: string
  prebidDate?: string
  isGovernment?: boolean
  requiresMBE?: boolean
  requiresDBE?: boolean
  prevailingWage?: boolean
  bondRequired?: boolean
  notes?: string
}

// ── Source Detection ─────────────────────────────────────────────────────────

const SOURCE_PATTERNS: { source: string; patterns: RegExp[] }[] = [
  {
    source: 'BUILDING_CONNECTED',
    patterns: [
      /buildingconnected\.com/i,
      /building\s*connected/i,
    ],
  },
  {
    source: 'EMMA',
    patterns: [
      /emma\.maryland\.gov/i,
      /emaryland\s*marketplace/i,
      /emma\s+solicitation/i,
    ],
  },
  {
    source: 'OPENGOV',
    patterns: [
      /opengov\.com/i,
      /open\s*gov/i,
    ],
  },
  {
    source: 'SHA_MDOT',
    patterns: [
      /roads\.maryland\.gov/i,
      /mdot/i,
      /sha\.maryland/i,
      /state\s*highway/i,
    ],
  },
]

function detectSource(email: RawEmail): string {
  const text = `${email.from} ${email.subject}`.toLowerCase()
  for (const { source, patterns } of SOURCE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return source
  }
  return 'DIRECT_INVITE'
}

// ── Helper: Extract regex match ─────────────────────────────────────────────

function extract(text: string, pattern: RegExp, group = 1): string | undefined {
  const match = text.match(pattern)
  return match?.[group]?.trim() || undefined
}

function extractDate(text: string): string | undefined {
  // Match patterns like "March 15, 2026", "03/15/2026", "2026-03-15"
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match) {
      const d = new Date(match[1])
      if (!isNaN(d.getTime())) return d.toISOString()
    }
  }
  return undefined
}

function extractCurrency(text: string): number | undefined {
  const match = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (match) return parseFloat(match[1].replace(/,/g, ''))
  return undefined
}

// ── Source-Specific Parsers ─────────────────────────────────────────────────

function parseBuildingConnected(email: RawEmail): ParsedBidData {
  const text = `${email.subject}\n${email.body}`

  // Extract project name from subject: "New Bid Invitation: PROJECT_NAME"
  const projectName =
    extract(text, /(?:bid\s+invitation|new\s+invitation)[:\s]+(.+?)(?:\.|$)/i) ||
    extract(email.subject, /:\s*(.+)$/) ||
    email.subject

  return {
    projectName,
    source: 'BUILDING_CONNECTED',
    gcName: extract(text, /(?:GC|general\s*contractor)[:\s]+(.+?)(?:\.|,|$)/i),
    scope: extract(text, /(?:scope|trade)[:\s]+(.+?)(?:\.|,|$)/i),
    dueDate: extractDate(text.replace(/bid\s*due[:\s]*/i, '')),
    location: extract(text, /(?:location|at|in)\s+([A-Z][^.]+?)(?:\.|GC|Bid|Scope)/i),
    estimatedValue: extractCurrency(text),
    sourceUrl: extract(text, /(https?:\/\/[^\s]+buildingconnected[^\s]+)/i),
    notes: `Parsed from BuildingConnected email received ${email.receivedAt || 'unknown'}`,
  }
}

function parseEMMA(email: RawEmail): ParsedBidData {
  const text = `${email.subject}\n${email.body}`

  return {
    projectName: extract(text, /(?:solicitation|title)[:\s]+(.+?)(?:\n|$)/i) || email.subject,
    source: 'EMMA',
    sourceId: extract(text, /(?:solicitation\s*#?|SOL-?)[:\s]*(\S+)/i),
    ownerName: extract(text, /(?:agency|department|owner)[:\s]+(.+?)(?:\n|$)/i),
    scope: extract(text, /(?:scope|category|service)[:\s]+(.+?)(?:\n|$)/i),
    dueDate: extractDate(text),
    estimatedValue: extractCurrency(text),
    isGovernment: true,
    requiresMBE: /mbe/i.test(text),
    requiresDBE: /dbe/i.test(text),
    prevailingWage: /prevailing\s*wage/i.test(text),
    sourceUrl: extract(text, /(https?:\/\/[^\s]*emma[^\s]*)/i),
    notes: `Parsed from eMMA email received ${email.receivedAt || 'unknown'}`,
  }
}

function parseOpenGov(email: RawEmail): ParsedBidData {
  const text = `${email.subject}\n${email.body}`

  return {
    projectName: extract(text, /(?:listing|opportunity|title)[:\s]+(.+?)(?:\n|$)/i) || email.subject,
    source: 'OPENGOV',
    ownerName: extract(text, /(?:jurisdiction|agency|entity)[:\s]+(.+?)(?:\n|$)/i),
    scope: extract(text, /(?:scope|category|type)[:\s]+(.+?)(?:\n|$)/i),
    dueDate: extractDate(text),
    location: extract(text, /(?:location|jurisdiction)[:\s]+(.+?)(?:\n|$)/i),
    isGovernment: true,
    sourceUrl: extract(text, /(https?:\/\/[^\s]*opengov[^\s]*)/i),
    notes: `Parsed from OpenGov email received ${email.receivedAt || 'unknown'}`,
  }
}

function parseSHAMDOT(email: RawEmail): ParsedBidData {
  const text = `${email.subject}\n${email.body}`

  return {
    projectName: extract(text, /(?:project|contract)[:\s]+(.+?)(?:\n|$)/i) || email.subject,
    source: 'SHA_MDOT',
    projectNumber: extract(text, /(?:project\s*#?|contract\s*#?)[:\s]*([A-Z0-9-]+)/i),
    location: extract(text, /(?:location|route|road)[:\s]+(.+?)(?:\n|$)/i),
    scope: extract(text, /(?:scope|description|work\s*type)[:\s]+(.+?)(?:\n|$)/i),
    dueDate: extractDate(text),
    estimatedValue: extractCurrency(text),
    isGovernment: true,
    prevailingWage: true,
    bondRequired: true,
    sourceUrl: extract(text, /(https?:\/\/[^\s]*roads\.maryland[^\s]*)/i),
    notes: `Parsed from SHA/MDOT email received ${email.receivedAt || 'unknown'}`,
  }
}

function parseDirectInvite(email: RawEmail): ParsedBidData {
  const text = `${email.subject}\n${email.body}`

  // Freeform email — extract what we can
  return {
    projectName: extract(email.subject, /(?:re:|fw:|fwd:)?\s*(?:bid\s+(?:invitation|request)|invitation\s+to\s+bid|rfp|rfq)?[:\s]*(.+)/i) || email.subject,
    source: 'DIRECT_INVITE',
    gcName: extract(text, /(?:GC|general\s*contractor|from)[:\s]+(.+?)(?:\n|$)/i),
    scope: extract(text, /(?:scope|trade|work)[:\s]+(.+?)(?:\n|$)/i),
    dueDate: extractDate(text),
    location: extract(text, /(?:location|address|site)[:\s]+(.+?)(?:\n|$)/i),
    estimatedValue: extractCurrency(text),
    contactEmail: extract(email.from, /<?([^<>\s]+@[^<>\s]+)>?/),
    requiresMBE: /mbe/i.test(text),
    requiresDBE: /dbe/i.test(text),
    notes: `Parsed from direct invite email. From: ${email.from}. Received: ${email.receivedAt || 'unknown'}`,
  }
}

// ── Main Parse Function ─────────────────────────────────────────────────────

export function parseEmail(email: RawEmail): ParsedBidData {
  const source = detectSource(email)

  switch (source) {
    case 'BUILDING_CONNECTED': return parseBuildingConnected(email)
    case 'EMMA': return parseEMMA(email)
    case 'OPENGOV': return parseOpenGov(email)
    case 'SHA_MDOT': return parseSHAMDOT(email)
    default: return parseDirectInvite(email)
  }
}

// ── Duplicate Detection ─────────────────────────────────────────────────────

export async function checkDuplicate(data: ParsedBidData): Promise<{ isDuplicate: boolean; existingId?: string }> {
  // Check 1: Exact sourceId match
  if (data.sourceId) {
    const existing = await prismaAny.bidOpportunity.findFirst({
      where: { sourceId: data.sourceId, source: data.source },
      select: { id: true },
    })
    if (existing) return { isDuplicate: true, existingId: existing.id }
  }

  // Check 2: Fuzzy match on projectName + source + dueDate
  const where: any = {
    source: data.source,
    projectName: { contains: data.projectName.substring(0, 30), mode: 'insensitive' },
  }
  if (data.dueDate) {
    const due = new Date(data.dueDate)
    const dayBefore = new Date(due.getTime() - 24 * 60 * 60 * 1000)
    const dayAfter = new Date(due.getTime() + 24 * 60 * 60 * 1000)
    where.dueDate = { gte: dayBefore, lte: dayAfter }
  }

  const existing = await prismaAny.bidOpportunity.findFirst({
    where,
    select: { id: true },
  })
  if (existing) return { isDuplicate: true, existingId: existing.id }

  return { isDuplicate: false }
}

// ── Full Ingest Pipeline ────────────────────────────────────────────────────

export async function ingestEmail(email: RawEmail): Promise<{
  success: boolean
  action: 'created' | 'skipped_duplicate' | 'error'
  bidId?: string
  existingBidId?: string
  parsed?: ParsedBidData
  error?: string
}> {
  try {
    // 1. Parse email
    const parsed = parseEmail(email)

    // 2. Check for duplicates
    const { isDuplicate, existingId } = await checkDuplicate(parsed)
    if (isDuplicate) {
      return {
        success: true,
        action: 'skipped_duplicate',
        existingBidId: existingId,
        parsed,
      }
    }

    // 3. Create bid
    const bid = await bidService.createBid(parsed)

    return {
      success: true,
      action: 'created',
      bidId: bid.id,
      parsed,
    }
  } catch (error: any) {
    return {
      success: false,
      action: 'error',
      error: error.message,
    }
  }
}
