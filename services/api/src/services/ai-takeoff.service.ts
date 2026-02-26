/**
 * AI Takeoff Service
 *
 * Processes uploaded architectural plans (PDFs/images) to extract
 * construction scope items and map them to CTC task numbers.
 *
 * Flow:
 * 1. Extract text/content from uploaded plans
 * 2. AI analyzes content to identify construction scope items
 * 3. Map scope items to CTC tasks with quantities
 * 4. Present results for user review
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number; info: any }> =
  require('pdf-parse')
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedScopeItem {
  description: string
  area?: string          // e.g. "Room 101", "First Floor", "Exterior"
  csiDivision?: string   // e.g. "09" for finishes
  estimatedQuantity?: number
  unit?: string
  confidence: number     // 0-1
}

interface MappedCTCTask {
  ctcTaskNumber: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalCost: number
  confidence: number
  sourceScope: string    // Original scope item that generated this
}

// ---------------------------------------------------------------------------
// AI Plan Analysis
// ---------------------------------------------------------------------------

const PLAN_ANALYSIS_PROMPT = `You are a construction estimator analyzing architectural plans or project specifications.

Extract all identifiable construction scope items from the text. For each item, provide:
- description: What work is described
- area: Where in the building (room, floor, zone)
- csiDivision: The CSI MasterFormat division code (2 digits: 01-49)
- estimatedQuantity: Your best estimate of quantity
- unit: Unit of measure (SF, LF, EA, CY, etc.)
- confidence: How confident you are (0-1)

Return a JSON object:
{
  "scopeItems": [
    {
      "description": "Interior painting, 2 coats, standard",
      "area": "First Floor Offices",
      "csiDivision": "09",
      "estimatedQuantity": 2400,
      "unit": "SF",
      "confidence": 0.8
    }
  ],
  "projectSummary": {
    "buildingType": "office/school/hospital/etc",
    "estimatedSquareFootage": 5000,
    "floors": 2,
    "primaryScopes": ["finishes", "electrical", "plumbing"]
  }
}

Rules:
- Extract every identifiable scope of work, even partial ones
- If quantities aren't explicit, estimate based on building dimensions
- Use standard construction units (SF, LF, EA, CY, SY, HR, MO)
- CSI divisions: 01=General, 02=Demo, 03=Concrete, 06=Wood, 07=Thermal, 08=Openings, 09=Finishes, 22=Plumbing, 23=HVAC, 26=Electrical, 31=Earthwork, 32=Exterior
- Return ONLY valid JSON`

async function analyzePlans(text: string): Promise<{
  scopeItems: ExtractedScopeItem[]
  projectSummary: any
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { scopeItems: [], projectSummary: {} }
  }

  const anthropic = new Anthropic({ apiKey })

  // Split into manageable chunks if text is very long
  const maxChars = 30000
  const textToAnalyze = text.length > maxChars ? text.substring(0, maxChars) : text

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: PLAN_ANALYSIS_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze these architectural plans/specifications and extract all construction scope items:\n\n${textToAnalyze}`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    return { scopeItems: [], projectSummary: {} }
  }

  let jsonStr = (textContent.text ?? '').trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }

  const parsed = JSON.parse(jsonStr)
  return {
    scopeItems: parsed.scopeItems || [],
    projectSummary: parsed.projectSummary || {},
  }
}

// ---------------------------------------------------------------------------
// CTC Task Mapping
// ---------------------------------------------------------------------------

async function mapScopeToCTC(scopeItems: ExtractedScopeItem[]): Promise<MappedCTCTask[]> {
  const mapped: MappedCTCTask[] = []

  for (const item of scopeItems) {
    // Search for matching CTC tasks by division and description keywords
    const where: any = {
      sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
      isActive: true,
    }

    if (item.csiDivision) {
      where.tags = { has: `div-${item.csiDivision}` }
    }

    // Search by keywords from description
    const keywords = item.description.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    if (keywords.length > 0) {
      where.OR = keywords.slice(0, 3).map(kw => ({
        name: { contains: kw, mode: 'insensitive' },
      }))
    }

    const candidates = await (prisma as any).assembly.findMany({
      where,
      take: 5,
      orderBy: { unitCost: 'desc' },
    })

    if (candidates.length > 0) {
      // Pick best match (first candidate for now; could add scoring)
      const best = candidates[0]
      const qty = item.estimatedQuantity || 1

      mapped.push({
        ctcTaskNumber: best.ctcTaskNumber || best.id,
        description: best.name,
        quantity: qty,
        unit: best.unit || item.unit || 'EA',
        unitPrice: Number(best.unitCost) || 0,
        totalCost: (Number(best.unitCost) || 0) * qty,
        confidence: item.confidence * 0.9, // Slight reduction for mapping uncertainty
        sourceScope: item.description,
      })
    }
  }

  return mapped
}

// ---------------------------------------------------------------------------
// Main Processing Pipeline
// ---------------------------------------------------------------------------

export async function processAITakeoff(
  jobId: string,
  fileBuffer: Buffer,
): Promise<void> {
  const updateJob = async (data: Record<string, any>) => {
    await (prisma as any).takeoffJob.update({
      where: { id: jobId },
      data: { ...data, updatedAt: new Date() },
    })
  }

  try {
    // Step 1: Extract text from plans
    await updateJob({ status: 'TAKEOFF_ANALYZING', progress: 10, startedAt: new Date() })

    let text: string
    let pageCount: number
    try {
      const result = await pdfParse(fileBuffer)
      text = result.text
      pageCount = result.numpages
    } catch {
      // If not a PDF, treat the buffer as text
      text = fileBuffer.toString('utf-8')
      pageCount = 1
    }

    await updateJob({ pageCount, progress: 25 })

    // Step 2: AI analysis to extract scope items
    await updateJob({ status: 'TAKEOFF_EXTRACTING', progress: 30 })
    const { scopeItems, projectSummary } = await analyzePlans(text)

    await updateJob({
      extractedScopes: scopeItems,
      progress: 60,
    })

    // Step 3: Map scope items to CTC tasks
    await updateJob({ status: 'TAKEOFF_MAPPING', progress: 65 })
    const mappedTasks = await mapScopeToCTC(scopeItems)

    const matched = mappedTasks.filter(t => t.confidence > 0.3).length
    const unmatched = scopeItems.length - matched
    const avgConfidence = mappedTasks.length > 0
      ? mappedTasks.reduce((sum, t) => sum + t.confidence, 0) / mappedTasks.length
      : 0

    // Step 4: Set to review status
    await updateJob({
      status: 'TAKEOFF_REVIEW',
      progress: 100,
      extractedTasks: mappedTasks,
      confidence: avgConfidence,
      ctcTasksMatched: matched,
      ctcTasksUnmatched: unmatched,
      lineItemsGenerated: mappedTasks.length,
    })

    console.log(
      `AI takeoff job ${jobId} ready for review: ${mappedTasks.length} tasks mapped, ` +
      `${matched} matched, confidence ${(avgConfidence * 100).toFixed(1)}%`
    )
  } catch (err: any) {
    console.error(`AI takeoff job ${jobId} failed:`, err)
    await updateJob({
      status: 'TAKEOFF_FAILED',
      errors: [err.message || 'Unknown error'],
      completedAt: new Date(),
    }).catch(() => {})
  }
}
