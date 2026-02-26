/**
 * Cost Code Import Service
 * Handles PDF text extraction + AI-powered structuring of cost code books.
 *
 * Flow:
 * 1. Upload PDF → store in Supabase Storage
 * 2. Extract raw text via pdf-parse
 * 3. Send text to Claude AI in page-sized chunks for structured extraction
 * 4. Insert structured data into the database (MaterialCost, LaborRate, EquipmentRate)
 * 5. Track progress via CostCodeImportJob
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number; info: any }> =
  require('pdf-parse')
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedMaterial {
  csiCode?: string
  name: string
  description?: string
  category: string
  unit: string
  unitCost: number
  minCost?: number
  maxCost?: number
  wasteFactor?: number
  supplier?: string
}

interface ExtractedLabor {
  trade: string
  classification?: string
  description?: string
  baseRate: number
  burdenRate?: number
  totalRate: number
  overtimeMultiplier?: number
  region?: string
}

interface ExtractedEquipment {
  category: string
  name: string
  description?: string
  dailyRate: number
  weeklyRate?: number
  monthlyRate?: number
  operatorRequired?: boolean
  fuelCostPerHour?: number
}

interface ExtractedAssembly {
  csiCode?: string
  name: string
  description?: string
  category: string
  unit: string
  materialCost: number
  laborCost: number
  equipmentCost: number
  laborHours?: number
  crewSize?: number
}

interface ExtractionResult {
  materials: ExtractedMaterial[]
  laborRates: ExtractedLabor[]
  equipmentRates: ExtractedEquipment[]
  assemblies: ExtractedAssembly[]
}

// ---------------------------------------------------------------------------
// PDF Text Extraction
// ---------------------------------------------------------------------------

export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const result = await pdfParse(buffer)
  return {
    text: result.text,
    numPages: result.numpages,
  }
}

// ---------------------------------------------------------------------------
// AI Structuring — split text into chunks, send each to Claude
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a construction cost data extraction expert. You analyze text extracted from construction cost code books (like RSMeans, Craftsman, etc.) and convert them into structured JSON data.

You MUST return a JSON object with these four arrays:
{
  "materials": [...],
  "laborRates": [...],
  "equipmentRates": [...],
  "assemblies": [...]
}

Each material must have: name (string), category (one of: CONCRETE, MASONRY, METALS, WOOD_PLASTICS_COMPOSITES, THERMAL_MOISTURE, OPENINGS, FINISHES, SPECIALTIES, EQUIPMENT_MATERIAL, FURNISHINGS, PLUMBING_MATERIAL, HVAC_MATERIAL, ELECTRICAL_MATERIAL, EARTHWORK, EXTERIOR_IMPROVEMENTS, UTILITIES, GENERAL_CONDITIONS, OTHER_MATERIAL), unit (string like "sf", "lf", "ea", "cy", "ton", "bag", "gal"), unitCost (number).
Optional fields: csiCode, description, minCost, maxCost, wasteFactor, supplier.

Each labor rate must have: trade (one of: GENERAL_LABOR, CARPENTER, ELECTRICIAN, PLUMBER, HVAC_TECHNICIAN, PAINTER, DRYWALL_FINISHER, TILE_SETTER, ROOFER, MASON, CONCRETE_FINISHER, IRONWORKER, SHEET_METAL_WORKER, INSULATOR, GLAZIER, FLOORING_INSTALLER, CABINET_MAKER, DEMOLITION, EXCAVATOR_OPERATOR, CRANE_OPERATOR, FOREMAN, SUPERINTENDENT, PROJECT_MANAGER_LABOR, SAFETY_OFFICER, OTHER_LABOR), baseRate (number), totalRate (number).
Optional fields: classification, description, burdenRate, overtimeMultiplier, region.

Each equipment rate must have: category (one of: EXCAVATION, LIFTING, CONCRETE_EQUIP, COMPACTION, HAULING, SCAFFOLDING, POWER_TOOLS, SAFETY_EQUIP, TEMPORARY_FACILITIES, SURVEYING, TESTING_EQUIP, CLEANING_EQUIP, OTHER_EQUIP), name (string), dailyRate (number).
Optional fields: description, weeklyRate, monthlyRate, operatorRequired, fuelCostPerHour.

Each assembly must have: name (string), category (one of: SITEWORK, FOUNDATIONS, CONCRETE_FLATWORK, FRAMING, ROOFING_ASSEMBLY, EXTERIOR_FINISHES, INTERIOR_FINISHES, DRYWALL, PAINTING, FLOORING, TILE, CABINETRY, COUNTERTOPS, DOORS_HARDWARE, WINDOWS, PLUMBING_ROUGH, PLUMBING_FINISH, ELECTRICAL_ROUGH, ELECTRICAL_FINISH, HVAC_ROUGH, HVAC_FINISH, INSULATION_ASSEMBLY, DEMOLITION_ASSEMBLY, CLEANUP, PERMITS_FEES, GENERAL_CONDITIONS_ASSEMBLY, OTHER_ASSEMBLY), unit (string), materialCost (number), laborCost (number), equipmentCost (number).
Optional fields: csiCode, description, laborHours, crewSize.

Rules:
- All costs are in USD (numbers, no currency symbols)
- If a value is unclear, use your best estimate or omit it
- Map CSI codes where possible (e.g., 03 = Concrete, 04 = Masonry)
- For items that don't clearly fall into a category, use the closest match or "OTHER_*"
- Return ONLY valid JSON, no markdown or commentary
- If the text does not contain any cost data, return empty arrays`

function splitTextIntoChunks(text: string, maxCharsPerChunk = 12000): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []
  let currentChunk = ''

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxCharsPerChunk) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  return chunks
}

export async function structureWithAI(text: string): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping AI extraction, returning empty result')
    return { materials: [], laborRates: [], equipmentRates: [], assemblies: [] }
  }

  const anthropic = new Anthropic({ apiKey })
  const chunks = splitTextIntoChunks(text)

  const allResults: ExtractionResult = {
    materials: [],
    laborRates: [],
    equipmentRates: [],
    assemblies: [],
  }

  for (const chunk of chunks) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Extract all construction cost data from the following text. Return a JSON object with materials, laborRates, equipmentRates, and assemblies arrays:\n\n${chunk}`,
          },
        ],
      })

      // Extract JSON from response
      const textContent = response.content.find(c => c.type === 'text')
      if (!textContent || textContent.type !== 'text') continue

      let jsonStr = (textContent.text ?? '').trim()
      // Handle markdown code blocks
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(jsonStr)
      if (parsed.materials) allResults.materials.push(...parsed.materials)
      if (parsed.laborRates) allResults.laborRates.push(...parsed.laborRates)
      if (parsed.equipmentRates) allResults.equipmentRates.push(...parsed.equipmentRates)
      if (parsed.assemblies) allResults.assemblies.push(...parsed.assemblies)
    } catch (err: any) {
      console.error(`AI extraction error for chunk: ${err.message}`)
      // Continue with remaining chunks
    }
  }

  return allResults
}

// ---------------------------------------------------------------------------
// Database Import — insert structured data into Prisma
// ---------------------------------------------------------------------------

export async function importExtractedData(
  costDatabaseId: string,
  data: ExtractionResult,
): Promise<{
  materialsImported: number
  laborImported: number
  equipmentImported: number
  assembliesImported: number
  errors: string[]
}> {
  const errors: string[] = []
  let materialsImported = 0
  let laborImported = 0
  let equipmentImported = 0
  let assembliesImported = 0

  // Import materials
  for (const mat of data.materials) {
    try {
      await (prisma as any).materialCost.create({
        data: {
          costDatabaseId,
          csiCode: mat.csiCode,
          name: mat.name,
          description: mat.description,
          category: mat.category,
          unit: mat.unit,
          unitCost: mat.unitCost,
          minCost: mat.minCost,
          maxCost: mat.maxCost,
          wasteFactor: mat.wasteFactor || 1.05,
          supplier: mat.supplier,
        },
      })
      materialsImported++
    } catch (err: any) {
      errors.push(`Material "${mat.name}": ${err.message}`)
    }
  }

  // Import labor rates
  for (const labor of data.laborRates) {
    try {
      await (prisma as any).laborRate.create({
        data: {
          costDatabaseId,
          trade: labor.trade,
          classification: labor.classification,
          description: labor.description,
          baseRate: labor.baseRate,
          burdenRate: labor.burdenRate,
          totalRate: labor.totalRate,
          overtimeMultiplier: labor.overtimeMultiplier || 1.5,
          region: labor.region,
        },
      })
      laborImported++
    } catch (err: any) {
      errors.push(`Labor "${labor.trade}": ${err.message}`)
    }
  }

  // Import equipment rates
  for (const equip of data.equipmentRates) {
    try {
      await (prisma as any).equipmentRate.create({
        data: {
          costDatabaseId,
          category: equip.category,
          name: equip.name,
          description: equip.description,
          dailyRate: equip.dailyRate,
          weeklyRate: equip.weeklyRate,
          monthlyRate: equip.monthlyRate,
          operatorRequired: equip.operatorRequired || false,
          fuelCostPerHour: equip.fuelCostPerHour,
        },
      })
      equipmentImported++
    } catch (err: any) {
      errors.push(`Equipment "${equip.name}": ${err.message}`)
    }
  }

  // Import assemblies
  for (const asm of data.assemblies) {
    try {
      const unitCost = (asm.materialCost || 0) + (asm.laborCost || 0) + (asm.equipmentCost || 0)
      await (prisma as any).assembly.create({
        data: {
          costDatabaseId,
          csiCode: asm.csiCode,
          name: asm.name,
          description: asm.description,
          category: asm.category || 'OTHER_ASSEMBLY',
          unit: asm.unit,
          unitCost,
          materialCost: asm.materialCost || 0,
          laborCost: asm.laborCost || 0,
          equipmentCost: asm.equipmentCost || 0,
          laborHours: asm.laborHours || 0,
          crewSize: asm.crewSize,
        },
      })
      assembliesImported++
    } catch (err: any) {
      errors.push(`Assembly "${asm.name}": ${err.message}`)
    }
  }

  return { materialsImported, laborImported, equipmentImported, assembliesImported, errors }
}

// ---------------------------------------------------------------------------
// Full Pipeline — orchestrates PDF → AI → DB for a single import job
// ---------------------------------------------------------------------------

export async function processImportJob(jobId: string, pdfBuffer: Buffer): Promise<void> {
  const updateJob = async (data: Record<string, any>) => {
    await (prisma as any).costCodeImportJob.update({
      where: { id: jobId },
      data: { ...data, updatedAt: new Date() },
    })
  }

  try {
    // Step 1: Extract text
    await updateJob({ status: 'EXTRACTING', progress: 10, startedAt: new Date() })
    const { text, numPages } = await extractTextFromPDF(pdfBuffer)
    await updateJob({ totalPages: numPages, processedPages: numPages, extractedText: text, progress: 30 })

    // Step 2: AI structuring
    await updateJob({ status: 'STRUCTURING', progress: 40 })
    const structured = await structureWithAI(text)
    await updateJob({
      structuredData: structured as any,
      progress: 70,
    })

    // Step 3: Get or create cost database
    const job = await (prisma as any).costCodeImportJob.findUnique({ where: { id: jobId } })
    let costDatabaseId = job.costDatabaseId

    if (!costDatabaseId) {
      // Create a new cost database from the import
      const db = await (prisma as any).costDatabase.create({
        data: {
          name: job.fileName.replace(/\.pdf$/i, ''),
          region: 'National',
          type: 'IMPORTED',
          version: new Date().toISOString().split('T')[0],
          source: `PDF Import: ${job.fileName}`,
        },
      })
      costDatabaseId = db.id
      await updateJob({ costDatabaseId })
    }

    // Step 4: Import into database
    await updateJob({ status: 'IMPORTING', progress: 75 })
    const result = await importExtractedData(costDatabaseId, structured)

    // Step 5: Complete
    await updateJob({
      status: 'COMPLETED',
      progress: 100,
      materialsFound: result.materialsImported,
      laborRatesFound: result.laborImported,
      equipmentFound: result.equipmentImported,
      assembliesFound: result.assembliesImported,
      totalImported: result.materialsImported + result.laborImported + result.equipmentImported + result.assembliesImported,
      totalSkipped: result.errors.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
      completedAt: new Date(),
    })
  } catch (err: any) {
    console.error(`Import job ${jobId} failed:`, err)
    await updateJob({
      status: 'FAILED',
      errors: [err.message || 'Unknown error'],
      completedAt: new Date(),
    }).catch(() => {})
  }
}
