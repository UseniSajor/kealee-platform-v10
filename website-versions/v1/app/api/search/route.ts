import { NextRequest, NextResponse } from 'next/server'

// All valid project paths with rich keyword context for Claude
const PROJECT_PATH_CONTEXT = [
  { path: 'kitchen_remodel',          label: 'Kitchen Remodel',             keywords: 'kitchen, cabinets, countertops, appliances, cooking, backsplash, island, layout' },
  { path: 'bathroom_remodel',         label: 'Bathroom Remodel',            keywords: 'bathroom, bath, shower, toilet, vanity, tile, plumbing, master bath, powder room' },
  { path: 'addition_expansion',       label: 'Addition / Expansion',        keywords: 'addition, expand, bump out, rear addition, pop top, second floor, ADU, accessory dwelling, in-law suite, garage conversion, basement addition' },
  { path: 'whole_home_remodel',       label: 'Whole-Home Remodel',          keywords: 'whole home, full house, gut renovation, major renovation, everything, entire house, complete remodel' },
  { path: 'exterior_concept',         label: 'Exterior / Curb Appeal',      keywords: 'exterior, curb appeal, facade, siding, roof, driveway, front door, paint, windows, landscaping, hardscaping, patio, deck, fence, outdoor living' },
  { path: 'interior_reno_concept',    label: 'Interior Renovation Concept', keywords: 'interior, room redesign, open floor plan, living room, dining room, bedroom, layout change, interior design concept' },
  { path: 'whole_home_concept',       label: 'Whole Home Concept',          keywords: 'whole home concept, full property vision, complete transformation, all rooms, design concept' },
  { path: 'garden_concept',           label: 'Garden & Farming',            keywords: 'garden, raised beds, farming, vegetables, greenhouse, irrigation, backyard farm, landscaping, planting, orchard' },
  { path: 'developer_concept',        label: 'Developer Concept',           keywords: 'developer, investment property, ground-up, new construction, infill, development vision' },
  { path: 'multi_unit_residential',   label: 'Multi-Unit Residential',      keywords: 'ADU, duplex, triplex, fourplex, apartment, multi-unit, accessory dwelling, rental units, income property' },
  { path: 'mixed_use',                label: 'Mixed-Use Development',       keywords: 'mixed use, retail and residential, ground floor retail, apartments above, commercial residential' },
  { path: 'commercial_office',        label: 'Commercial Office',           keywords: 'office, workspace, commercial, coworking, corporate, tenant improvement, TI, office buildout' },
  { path: 'development_feasibility',  label: 'Development Feasibility',     keywords: 'feasibility, land development, parcel, pro forma, IRR, ground up, entitlements, zoning analysis' },
  { path: 'townhome_subdivision',     label: 'Townhome Subdivision',        keywords: 'townhomes, townhouse, row homes, subdivision, for-sale development, attached units' },
  { path: 'single_family_subdivision',label: 'Single-Family Subdivision',   keywords: 'single family, SFR, subdivision, lots, land development, detached homes' },
  { path: 'single_lot_development',   label: 'Single-Lot Development',      keywords: 'single lot, infill, new build, new home, custom home, tear down, one lot' },
  { path: 'design_build',             label: 'Design + Build',              keywords: 'design build, integrated, design and build, architect, general contractor, full service' },
  { path: 'permit_path_only',         label: 'Permit Only',                 keywords: 'permit, permits, already have plans, drawings ready, just permits, file permit, submit plans, building permit' },
  { path: 'interior_renovation',      label: 'Interior Renovation',         keywords: 'room renovation, interior upgrade, flooring, painting, finishing, cosmetic renovation' },
  { path: 'capture_site_concept',     label: 'Capture / Site Survey',       keywords: 'capture, site photos, survey, property capture, mobile capture, existing conditions' },
] as const

type ProjectPath = typeof PROJECT_PATH_CONTEXT[number]['path']

export interface SearchResult {
  projectPath: ProjectPath
  label: string
  confidence: number
  reasoning: string
  directRoute: boolean   // true = go straight to /intake, false = show concept gate
}

// Lightweight fuzzy match — fast fallback when Claude is unavailable
function fuzzyMatch(query: string): SearchResult {
  const q = query.toLowerCase()
  let best = PROJECT_PATH_CONTEXT[0]
  let bestScore = 0

  for (const p of PROJECT_PATH_CONTEXT) {
    const haystack = `${p.label} ${p.keywords}`.toLowerCase()
    const words = q.split(/\s+/).filter(Boolean)
    const score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0) / Math.max(words.length, 1)
    if (score > bestScore) { bestScore = score; best = p }
  }

  return {
    projectPath: best.path,
    label: best.label,
    confidence: bestScore,
    reasoning: `Matched "${best.label}" based on keyword similarity`,
    directRoute: bestScore >= 0.5,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json() as { query?: string }
    if (!query?.trim()) {
      return NextResponse.json({ error: 'query required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // No key — fall back to keyword matching
      return NextResponse.json(fuzzyMatch(query))
    }

    const pathList = PROJECT_PATH_CONTEXT.map(p =>
      `- ${p.path}: ${p.label} (${p.keywords})`
    ).join('\n')

    const prompt = `You are a construction project classifier for the Kealee platform.

Given a user's search query, identify the single most appropriate project path.

Available project paths:
${pathList}

User query: "${query}"

Rules:
- Return ONLY valid JSON, no markdown, no explanation outside JSON
- Choose the most specific path that matches the intent
- If the user mentions "permit" or "already have plans", use permit_path_only
- If ambiguous between concept and remodel paths, prefer the specific remodel path (e.g. kitchen_remodel over interior_reno_concept)
- confidence: 0.0–1.0 (how certain you are)
- directRoute: true if confidence >= 0.7 (send user straight to intake form)

Response format:
{"projectPath":"<path>","label":"<label>","confidence":0.9,"reasoning":"<one sentence>","directRoute":true}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json(fuzzyMatch(query))
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> }
    const text = data.content?.[0]?.text?.trim() ?? ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json(fuzzyMatch(query))

    const parsed = JSON.parse(jsonMatch[0]) as SearchResult

    // Validate returned path is real
    const isValid = PROJECT_PATH_CONTEXT.some(p => p.path === parsed.projectPath)
    if (!isValid) return NextResponse.json(fuzzyMatch(query))

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

// GET endpoint for autocomplete suggestions
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase() ?? ''

  if (!q || q.length < 2) {
    // Return all paths as suggestions
    return NextResponse.json(
      PROJECT_PATH_CONTEXT.map(p => ({ path: p.path, label: p.label }))
    )
  }

  const results = PROJECT_PATH_CONTEXT
    .filter(p => {
      const haystack = `${p.label} ${p.keywords}`.toLowerCase()
      return q.split(' ').some(w => w && haystack.includes(w))
    })
    .slice(0, 8)
    .map(p => ({ path: p.path, label: p.label }))

  return NextResponse.json(results.length ? results : PROJECT_PATH_CONTEXT.slice(0, 8).map(p => ({ path: p.path, label: p.label })))
}
