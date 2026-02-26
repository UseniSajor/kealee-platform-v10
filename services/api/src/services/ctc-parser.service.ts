/**
 * CTC (Construction Task Catalog) Parser Service
 *
 * Specialized parser for the Gordian CTC format used by MD DGS JOC contracts.
 * Handles CSI MasterFormat division boundaries, modifier tasks, and assembly
 * precedence specific to the CTC's 3500-page structure.
 *
 * Flow:
 * 1. Extract text from CTC PDF via pdf-parse
 * 2. Split by CSI division boundaries (01-49)
 * 3. Batch 10-15 pages per Claude API call (~250 calls for full catalog)
 * 4. Parse structured task data: task number, description, unit, unit price,
 *    labor/material/equipment breakdown
 * 5. Identify modifier tasks (tasks that adjust a parent task's pricing)
 * 6. Insert as Assembly records linked to a CTC-specific CostDatabase
 *
 * Extends patterns from cost-code-import.service.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number; info: any }> =
  require('pdf-parse')
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CTCTask {
  taskNumber: string          // e.g. "01-001", "03-210.01"
  csiDivision: string         // CSI division: "01", "03", "09", etc.
  csiCode: string             // Full CSI code: "03 30 00", "09 91 00"
  description: string
  longDescription?: string
  unit: string                // "EA", "SF", "LF", "CY", "HR", etc.
  unitPrice: number           // Total unit price
  laborCost: number
  materialCost: number
  equipmentCost: number
  laborHours?: number
  isModifier: boolean         // True if this task modifies another task
  modifierOf?: string         // Parent task number if modifier
  modifierType?: 'ADD' | 'DEDUCT' | 'REPLACE' | 'PERCENTAGE'
  modifierValue?: number      // Percentage or fixed amount
  category?: string           // Subcategory within the division
  notes?: string
}

export interface CTCDivision {
  code: string                // "01", "02", "03", etc.
  name: string                // "General Requirements", "Existing Conditions", etc.
  taskCount: number
  startPage?: number
  endPage?: number
}

export interface CTCExtractionResult {
  divisions: CTCDivision[]
  tasks: CTCTask[]
  metadata: {
    source: string
    version: string
    effectiveDate?: string
    region: string
    totalPages: number
    totalTasks: number
    totalModifiers: number
  }
}

// CSI MasterFormat Division names
const CSI_DIVISIONS: Record<string, string> = {
  '01': 'General Requirements',
  '02': 'Existing Conditions',
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics, and Composites',
  '07': 'Thermal and Moisture Protection',
  '08': 'Openings',
  '09': 'Finishes',
  '10': 'Specialties',
  '11': 'Equipment',
  '12': 'Furnishings',
  '13': 'Special Construction',
  '14': 'Conveying Equipment',
  '21': 'Fire Suppression',
  '22': 'Plumbing',
  '23': 'Heating, Ventilating, and Air Conditioning (HVAC)',
  '25': 'Integrated Automation',
  '26': 'Electrical',
  '27': 'Communications',
  '28': 'Electronic Safety and Security',
  '31': 'Earthwork',
  '32': 'Exterior Improvements',
  '33': 'Utilities',
  '34': 'Transportation',
  '35': 'Waterway and Marine Construction',
  '40': 'Process Integration',
  '41': 'Material Processing and Handling Equipment',
  '42': 'Process Heating, Cooling, and Drying Equipment',
  '43': 'Process Gas and Liquid Handling',
  '44': 'Pollution and Waste Control Equipment',
  '46': 'Water and Wastewater Equipment',
  '48': 'Electrical Power Generation',
}

// Map CSI divisions to Assembly categories
const CSI_TO_ASSEMBLY_CATEGORY: Record<string, string> = {
  '01': 'GENERAL_CONDITIONS_ASSEMBLY',
  '02': 'DEMOLITION_ASSEMBLY',
  '03': 'CONCRETE_FLATWORK',
  '04': 'OTHER_ASSEMBLY',     // Masonry
  '05': 'OTHER_ASSEMBLY',     // Metals
  '06': 'FRAMING',
  '07': 'ROOFING_ASSEMBLY',
  '08': 'DOORS_HARDWARE',
  '09': 'INTERIOR_FINISHES',
  '10': 'OTHER_ASSEMBLY',     // Specialties
  '11': 'OTHER_ASSEMBLY',     // Equipment
  '12': 'OTHER_ASSEMBLY',     // Furnishings
  '13': 'OTHER_ASSEMBLY',     // Special Construction
  '14': 'OTHER_ASSEMBLY',     // Conveying Equipment
  '21': 'OTHER_ASSEMBLY',     // Fire Suppression
  '22': 'PLUMBING_ROUGH',
  '23': 'HVAC_ROUGH',
  '26': 'ELECTRICAL_ROUGH',
  '27': 'OTHER_ASSEMBLY',     // Communications
  '28': 'OTHER_ASSEMBLY',     // Electronic Safety
  '31': 'SITEWORK',
  '32': 'EXTERIOR_FINISHES',
  '33': 'OTHER_ASSEMBLY',     // Utilities
}

// ---------------------------------------------------------------------------
// PDF Text Extraction (reuses same approach as cost-code-import)
// ---------------------------------------------------------------------------

export async function extractCTCText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const result = await pdfParse(buffer)
  return {
    text: result.text,
    numPages: result.numpages,
  }
}

// ---------------------------------------------------------------------------
// Page Splitting — splits text into page-like chunks at division boundaries
// ---------------------------------------------------------------------------

/**
 * Splits the extracted CTC text into batches aligned on CSI division boundaries.
 * Target: ~10-15 pages worth of text per batch to stay within Claude's context.
 */
export function splitIntoBatches(text: string, targetPagesPerBatch = 12): string[] {
  const lines = text.split('\n')
  const batches: string[] = []
  let currentBatch = ''
  let lineCount = 0
  // ~60 lines per page is a rough estimate for CTC PDFs
  const linesPerBatch = targetPagesPerBatch * 60

  // Division boundary patterns (e.g., "DIVISION 03", "Division 03 -", "DIV. 03")
  const divisionBoundary = /^(?:DIVISION|DIV\.?)\s+(\d{2})\b/i

  for (const line of lines) {
    const isDivisionStart = divisionBoundary.test(line.trim())

    // If we hit a division boundary and current batch is large enough, flush
    if (isDivisionStart && lineCount >= linesPerBatch * 0.5) {
      if (currentBatch.trim()) {
        batches.push(currentBatch.trim())
      }
      currentBatch = line + '\n'
      lineCount = 1
      continue
    }

    currentBatch += line + '\n'
    lineCount++

    // If we exceed the target size, flush at next reasonable break
    if (lineCount >= linesPerBatch) {
      // Look for a natural break point (empty line, task boundary)
      if (line.trim() === '' || /^\d{2}-\d{3}/.test(line.trim())) {
        if (currentBatch.trim()) {
          batches.push(currentBatch.trim())
        }
        currentBatch = ''
        lineCount = 0
      }
    }
  }

  if (currentBatch.trim()) {
    batches.push(currentBatch.trim())
  }

  return batches
}

// ---------------------------------------------------------------------------
// AI Extraction — CTC-specific prompt for Gordian format
// ---------------------------------------------------------------------------

const CTC_SYSTEM_PROMPT = `You are a construction cost data extraction expert specializing in the Gordian Construction Task Catalog (CTC) format used for Job Order Contracting (JOC).

You analyze text extracted from CTC PDF pages and convert task entries into structured JSON.

CTC tasks follow a specific format:
- Task numbers like "03-210", "09-110.01", "26-050"
- The first two digits are the CSI MasterFormat division (03=Concrete, 09=Finishes, 26=Electrical)
- Tasks have a description, unit of measure, and unit price
- Unit prices are broken down into: labor, material, and equipment components
- Some tasks are "modifiers" that adjust a parent task's pricing (add, deduct, or percentage)
- Modifier tasks reference their parent task and indicate the adjustment type

You MUST return a JSON object:
{
  "tasks": [
    {
      "taskNumber": "03-210",
      "csiDivision": "03",
      "csiCode": "03 30 00",
      "description": "Remove and replace concrete sidewalk, 4 inch thick",
      "longDescription": "Includes removal of existing concrete, grading, forming, pouring, finishing and cleanup",
      "unit": "SF",
      "unitPrice": 12.50,
      "laborCost": 6.25,
      "materialCost": 4.75,
      "equipmentCost": 1.50,
      "laborHours": 0.15,
      "isModifier": false,
      "category": "Concrete Flatwork",
      "notes": null
    },
    {
      "taskNumber": "03-210.01",
      "csiDivision": "03",
      "csiCode": "03 30 00",
      "description": "Add for 6 inch thick (modifier to 03-210)",
      "unit": "SF",
      "unitPrice": 3.50,
      "laborCost": 1.00,
      "materialCost": 2.25,
      "equipmentCost": 0.25,
      "isModifier": true,
      "modifierOf": "03-210",
      "modifierType": "ADD",
      "modifierValue": 3.50,
      "category": "Concrete Flatwork"
    }
  ],
  "divisionDetected": "03",
  "pageRange": "approximate page numbers if visible"
}

Rules:
- All costs in USD (numbers only, no $ symbols)
- Task numbers must preserve the exact format from the CTC (including dots for modifiers)
- If labor/material/equipment breakdown is not explicit, estimate based on typical construction ratios:
  - Concrete work: 40% labor, 45% material, 15% equipment
  - Finishes: 55% labor, 40% material, 5% equipment
  - Electrical: 60% labor, 35% material, 5% equipment
  - Plumbing: 50% labor, 40% material, 10% equipment
  - General: 45% labor, 45% material, 10% equipment
- Identify modifier tasks by their relationship to parent tasks (indicated by ".01", ".02" suffixes or explicit "add for", "deduct for" language)
- modifierType should be: ADD (adds cost), DEDUCT (reduces cost), REPLACE (replaces base), PERCENTAGE (% adjustment)
- Return ONLY valid JSON — no markdown, no commentary
- If the text doesn't contain CTC task data, return {"tasks": [], "divisionDetected": null}`

export async function extractCTCTasksFromBatch(
  batchText: string,
  batchIndex: number,
  anthropic: Anthropic,
): Promise<CTCTask[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: CTC_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract all CTC construction tasks from the following text (batch ${batchIndex + 1}). Return a JSON object with a "tasks" array:\n\n${batchText}`,
        },
      ],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') return []

    let jsonStr = (textContent.text ?? '').trim()
    // Handle markdown code blocks
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    const parsed = JSON.parse(jsonStr)
    return (parsed.tasks || []) as CTCTask[]
  } catch (err: any) {
    console.error(`CTC extraction error for batch ${batchIndex}: ${err.message}`)
    return []
  }
}

// ---------------------------------------------------------------------------
// Full CTC Extraction Pipeline
// ---------------------------------------------------------------------------

export async function extractAllCTCTasks(
  text: string,
  onProgress?: (progress: number, message: string) => Promise<void>,
): Promise<CTCExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping CTC extraction')
    return {
      divisions: [],
      tasks: [],
      metadata: {
        source: 'CTC-Gordian-MD-DGS-2023',
        version: '1.0',
        region: 'MD-DC-VA',
        totalPages: 0,
        totalTasks: 0,
        totalModifiers: 0,
      },
    }
  }

  const anthropic = new Anthropic({ apiKey })
  const batches = splitIntoBatches(text)
  const allTasks: CTCTask[] = []
  const divisionMap = new Map<string, CTCDivision>()

  for (let i = 0; i < batches.length; i++) {
    const progressPct = Math.round(10 + (i / batches.length) * 60)
    if (onProgress) {
      await onProgress(progressPct, `Processing batch ${i + 1} of ${batches.length}`)
    }

    const tasks = await extractCTCTasksFromBatch(batches[i], i, anthropic)
    allTasks.push(...tasks)

    // Track divisions
    for (const task of tasks) {
      const divCode = task.csiDivision
      if (!divisionMap.has(divCode)) {
        divisionMap.set(divCode, {
          code: divCode,
          name: CSI_DIVISIONS[divCode] || `Division ${divCode}`,
          taskCount: 0,
        })
      }
      divisionMap.get(divCode)!.taskCount++
    }

    // Rate limiting: ~1 request per second to avoid API throttling
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const totalModifiers = allTasks.filter(t => t.isModifier).length

  return {
    divisions: Array.from(divisionMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
    tasks: allTasks,
    metadata: {
      source: 'CTC-Gordian-MD-DGS-2023',
      version: '1.0',
      region: 'MD-DC-VA',
      totalPages: 0, // Will be set by caller
      totalTasks: allTasks.length,
      totalModifiers,
    },
  }
}

// ---------------------------------------------------------------------------
// Database Import — Insert CTC tasks as Assembly records
// ---------------------------------------------------------------------------

export async function importCTCTasks(
  costDatabaseId: string,
  result: CTCExtractionResult,
  onProgress?: (progress: number, message: string) => Promise<void>,
): Promise<{
  assembliesImported: number
  errors: string[]
}> {
  const errors: string[] = []
  let assembliesImported = 0
  const totalTasks = result.tasks.length

  for (let i = 0; i < result.tasks.length; i++) {
    const task = result.tasks[i]

    if (onProgress && i % 50 === 0) {
      const pct = Math.round(75 + (i / totalTasks) * 20)
      await onProgress(pct, `Importing task ${i + 1} of ${totalTasks}`)
    }

    try {
      const category = CSI_TO_ASSEMBLY_CATEGORY[task.csiDivision] || 'OTHER_ASSEMBLY'
      const unitCost = task.unitPrice || (task.laborCost + task.materialCost + task.equipmentCost)

      await (prisma as any).assembly.create({
        data: {
          costDatabaseId,
          csiCode: task.csiCode || null,
          name: task.description,
          description: task.longDescription || null,
          category,
          subcategory: task.category || null,
          unit: task.unit || 'EA',
          unitCost: unitCost || 0,
          laborCost: task.laborCost || 0,
          materialCost: task.materialCost || 0,
          equipmentCost: task.equipmentCost || 0,
          laborHours: task.laborHours || 0,
          isActive: true,
          isTemplate: false,
          tags: [
            'ctc',
            `div-${task.csiDivision}`,
            ...(task.isModifier ? ['modifier'] : []),
          ],
          notes: task.notes || null,
          metadata: {
            source: 'CTC-Gordian-MD-DGS-2023',
            taskNumber: task.taskNumber,
            isModifier: task.isModifier,
            modifierOf: task.modifierOf || null,
            modifierType: task.modifierType || null,
            modifierValue: task.modifierValue || null,
          },
          // CTC-specific fields
          ctcTaskNumber: task.taskNumber,
          ctcModifierOf: task.isModifier ? task.modifierOf : null,
          sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
        },
      })
      assembliesImported++
    } catch (err: any) {
      errors.push(`Task ${task.taskNumber} "${task.description}": ${err.message}`)
    }
  }

  return { assembliesImported, errors }
}

// ---------------------------------------------------------------------------
// Full CTC Import Pipeline — orchestrates PDF → AI → DB
// ---------------------------------------------------------------------------

export async function processCTCImportJob(
  jobId: string,
  pdfBuffer: Buffer,
): Promise<void> {
  const updateJob = async (data: Record<string, any>) => {
    await (prisma as any).costCodeImportJob.update({
      where: { id: jobId },
      data: { ...data, updatedAt: new Date() },
    })
  }

  try {
    // Step 1: Extract text
    await updateJob({ status: 'EXTRACTING', progress: 5, startedAt: new Date() })
    const { text, numPages } = await extractCTCText(pdfBuffer)
    await updateJob({
      totalPages: numPages,
      processedPages: numPages,
      extractedText: text,
      progress: 10,
    })

    // Step 2: CTC-specific AI extraction
    await updateJob({ status: 'STRUCTURING', progress: 10 })
    const result = await extractAllCTCTasks(text, async (progress, message) => {
      await updateJob({ progress, aiTradeCategory: message })
    })
    result.metadata.totalPages = numPages

    await updateJob({
      structuredData: result as any,
      progress: 75,
      aiTradeCategory: 'construction-task-catalog',
      aiProjectType: 'joc',
      aiMethodology: 'gordian-ctc',
      aiConfidence: 0.85,
    })

    // Step 3: Get or create CTC cost database
    const job = await (prisma as any).costCodeImportJob.findUnique({ where: { id: jobId } })
    let costDatabaseId = job.costDatabaseId

    if (!costDatabaseId) {
      const db = await (prisma as any).costDatabase.create({
        data: {
          name: 'Construction Task Catalog (CTC) - MD DGS',
          description: 'Gordian Construction Task Catalog for Maryland Department of General Services Job Order Contracting',
          region: 'MD-DC-VA',
          type: 'IMPORTED',
          tier: 'STANDARD',
          version: new Date().toISOString().split('T')[0],
          source: 'CTC-Gordian-MD-DGS-2023',
          isActive: true,
          isStandard: true,
          tradeCategory: 'multi-trade',
          projectType: 'government-joc',
          methodology: 'gordian-ctc',
          visibility: 'ORG_ONLY',
          reviewStatus: 'DRAFT',
        },
      })
      costDatabaseId = db.id
      await updateJob({ costDatabaseId })
    }

    // Step 4: Import CTC tasks as Assembly records
    await updateJob({ status: 'IMPORTING', progress: 75 })
    const importResult = await importCTCTasks(costDatabaseId, result, async (progress, message) => {
      await updateJob({ progress })
    })

    // Step 5: Complete
    await updateJob({
      status: 'COMPLETED',
      progress: 100,
      assembliesFound: importResult.assembliesImported,
      totalImported: importResult.assembliesImported,
      totalSkipped: importResult.errors.length,
      errors: importResult.errors.length > 0 ? importResult.errors.slice(0, 100) : undefined, // Cap error list
      completedAt: new Date(),
    })

    console.log(
      `CTC import job ${jobId} completed: ${importResult.assembliesImported} tasks imported, ` +
      `${importResult.errors.length} errors, ${result.divisions.length} divisions`
    )
  } catch (err: any) {
    console.error(`CTC import job ${jobId} failed:`, err)
    await updateJob({
      status: 'FAILED',
      errors: [err.message || 'Unknown error'],
      completedAt: new Date(),
    }).catch(() => {})
  }
}
