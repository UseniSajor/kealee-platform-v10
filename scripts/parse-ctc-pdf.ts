/**
 * CTC PDF Parser — Regex-based extraction (no AI required)
 *
 * Parses the 4,666-page Construction Task Catalog® PDF from Gordian
 * and inserts all tasks as Assembly records in the database.
 *
 * Usage:
 *   cd kealee-platform-v10
 *   npx tsx scripts/parse-ctc-pdf.ts
 *
 * The CTC format per page:
 * - Header: Division name, CSI section numbers
 * - Task entries: "CSI_CODE  UOM  Description ... UNIT_COST [DEMO_COST]"
 * - Modifier lines: "For condition, Add/Deduct  AMOUNT"
 * - Section headers: "CSI_CODE  Section Name (parent)"
 */

import { PDFParse } from 'pdf-parse'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// L/M/E ratio estimates by CSI division (since CTC only provides total cost)
// ---------------------------------------------------------------------------
const LME_RATIOS: Record<string, { labor: number; material: number; equipment: number }> = {
  '01': { labor: 0.60, material: 0.25, equipment: 0.15 }, // General Requirements
  '02': { labor: 0.45, material: 0.10, equipment: 0.45 }, // Existing Conditions (demo heavy)
  '03': { labor: 0.40, material: 0.45, equipment: 0.15 }, // Concrete
  '04': { labor: 0.50, material: 0.42, equipment: 0.08 }, // Masonry
  '05': { labor: 0.40, material: 0.50, equipment: 0.10 }, // Metals
  '06': { labor: 0.50, material: 0.42, equipment: 0.08 }, // Wood, Plastics
  '07': { labor: 0.45, material: 0.45, equipment: 0.10 }, // Thermal/Moisture
  '08': { labor: 0.40, material: 0.55, equipment: 0.05 }, // Openings
  '09': { labor: 0.55, material: 0.40, equipment: 0.05 }, // Finishes
  '10': { labor: 0.40, material: 0.55, equipment: 0.05 }, // Specialties
  '11': { labor: 0.30, material: 0.60, equipment: 0.10 }, // Equipment
  '12': { labor: 0.35, material: 0.60, equipment: 0.05 }, // Furnishings
  '13': { labor: 0.40, material: 0.45, equipment: 0.15 }, // Special Construction
  '14': { labor: 0.35, material: 0.40, equipment: 0.25 }, // Conveying Equipment
  '21': { labor: 0.45, material: 0.45, equipment: 0.10 }, // Fire Suppression
  '22': { labor: 0.50, material: 0.40, equipment: 0.10 }, // Plumbing
  '23': { labor: 0.45, material: 0.45, equipment: 0.10 }, // HVAC
  '25': { labor: 0.55, material: 0.40, equipment: 0.05 }, // Integrated Automation
  '26': { labor: 0.55, material: 0.40, equipment: 0.05 }, // Electrical
  '27': { labor: 0.50, material: 0.45, equipment: 0.05 }, // Communications
  '28': { labor: 0.50, material: 0.45, equipment: 0.05 }, // Electronic Safety
  '31': { labor: 0.35, material: 0.15, equipment: 0.50 }, // Earthwork
  '32': { labor: 0.40, material: 0.45, equipment: 0.15 }, // Exterior Improvements
  '33': { labor: 0.40, material: 0.40, equipment: 0.20 }, // Utilities
  '34': { labor: 0.35, material: 0.35, equipment: 0.30 }, // Transportation
  '40': { labor: 0.40, material: 0.45, equipment: 0.15 }, // Process Integration
  '41': { labor: 0.35, material: 0.45, equipment: 0.20 }, // Material Processing
  '42': { labor: 0.35, material: 0.45, equipment: 0.20 }, // Process Heating
  '43': { labor: 0.40, material: 0.45, equipment: 0.15 }, // Gas/Liquid Handling
  '44': { labor: 0.40, material: 0.40, equipment: 0.20 }, // Pollution Control
  '46': { labor: 0.40, material: 0.40, equipment: 0.20 }, // Water/Wastewater
  '48': { labor: 0.35, material: 0.35, equipment: 0.30 }, // Electrical Power Gen
}
const DEFAULT_LME = { labor: 0.45, material: 0.40, equipment: 0.15 }

// CSI Division names
const CSI_DIVISIONS: Record<string, string> = {
  '01': 'General Requirements', '02': 'Existing Conditions', '03': 'Concrete',
  '04': 'Masonry', '05': 'Metals', '06': 'Wood, Plastics, and Composites',
  '07': 'Thermal and Moisture Protection', '08': 'Openings', '09': 'Finishes',
  '10': 'Specialties', '11': 'Equipment', '12': 'Furnishings',
  '13': 'Special Construction', '14': 'Conveying Equipment',
  '21': 'Fire Suppression', '22': 'Plumbing',
  '23': 'HVAC', '25': 'Integrated Automation', '26': 'Electrical',
  '27': 'Communications', '28': 'Electronic Safety and Security',
  '31': 'Earthwork', '32': 'Exterior Improvements', '33': 'Utilities',
  '34': 'Transportation', '40': 'Process Integration',
  '41': 'Material Processing Equipment', '42': 'Process Heating/Cooling',
  '43': 'Gas and Liquid Handling', '44': 'Pollution Control',
  '46': 'Water and Wastewater', '48': 'Electrical Power Generation',
}

// Assembly category mapping
const CSI_TO_CATEGORY: Record<string, string> = {
  '01': 'GENERAL_CONDITIONS_ASSEMBLY', '02': 'DEMOLITION_ASSEMBLY',
  '03': 'CONCRETE_FLATWORK', '04': 'OTHER_ASSEMBLY', '05': 'OTHER_ASSEMBLY',
  '06': 'FRAMING', '07': 'ROOFING_ASSEMBLY', '08': 'DOORS_HARDWARE',
  '09': 'INTERIOR_FINISHES', '10': 'OTHER_ASSEMBLY', '11': 'OTHER_ASSEMBLY',
  '12': 'OTHER_ASSEMBLY', '13': 'OTHER_ASSEMBLY', '14': 'OTHER_ASSEMBLY',
  '21': 'OTHER_ASSEMBLY', '22': 'PLUMBING_ROUGH', '23': 'HVAC_ROUGH',
  '26': 'ELECTRICAL_ROUGH', '27': 'OTHER_ASSEMBLY', '28': 'OTHER_ASSEMBLY',
  '31': 'SITEWORK', '32': 'EXTERIOR_FINISHES', '33': 'OTHER_ASSEMBLY',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ParsedTask {
  csiCode: string       // e.g. "03 01 30 51-0002"
  division: string      // e.g. "03"
  uom: string           // e.g. "SF", "EA", "LF"
  description: string
  unitCost: number
  demoCost: number | null
  modifiers: ParsedModifier[]
  notes: string[]
  parentRef: string | null  // parent CSI code if this is a subcategory header
}

interface ParsedModifier {
  condition: string     // e.g. "For Up To 100", "For Four-Wheel Drive"
  type: 'ADD' | 'DEDUCT'
  amount: number
}

// ---------------------------------------------------------------------------
// Regex patterns for CTC format
// ---------------------------------------------------------------------------

// Main task line: "03 01 30 51-0002  SF  Description text... 123.45 [67.89]"
const TASK_LINE_RE = /^(\d{2}\s+\d{2}\s+\d{2}\s+\d{2}-\d{4})\s+(\w+)\s+(.+?)\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?\s*$/

// Modifier line: "For condition, Add/Deduct  123.45" or "For condition, Add/Deduct  -123.45"
const MODIFIER_RE = /^For\s+(.+?),\s+(Add|Deduct)\s+(-?[\d,]+\.\d{2})\s*$/i

// Section header: "03 01 30 51-0001  Section Name (parent ref)"
const SECTION_HEADER_RE = /^(\d{2}\s+\d{2}\s+\d{2}\s+\d{2}-\d{4})\s+(.+?)(?:\s*\((\d{2}\s+\d{2}[^)]*)\))?\s*$/

// Note line
const NOTE_RE = /^Note:\s*(.+)$/i

// Continuation of previous line (starts with description-like text, no CSI code)
const CONTINUATION_RE = /^[A-Z][a-z].*\.\.\.*\s+([\d,]+\.\d{2})/

function parseNumber(s: string): number {
  return parseFloat(s.replace(/,/g, ''))
}

// ---------------------------------------------------------------------------
// Parse all pages
// ---------------------------------------------------------------------------
function parsePages(pages: Array<{ text: string; num: number }>): ParsedTask[] {
  const tasks: ParsedTask[] = []
  let currentTask: ParsedTask | null = null
  let noteBuffer: string[] = []
  let skippedHeaderPages = 0

  for (const page of pages) {
    const lines = page.text.split('\n')

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line === '.' || line === 'XXXXXXX') continue

      // Skip page headers/footers
      if (line.includes('copyright') || line.includes('The Gordian Group') ||
          line.includes('Maryland Department of General Services') ||
          line.includes('Page ') && line.match(/Page \d{2} - \d+/) ||
          line.match(/^(MINOR|TOTAL DIRECT|CSI UOM|June 2023)/) ||
          line.match(/^(DEMOLITION|UNIT COST)$/)) {
        continue
      }

      // Check for task line with pricing
      const taskMatch = line.match(TASK_LINE_RE)
      if (taskMatch) {
        // Save previous task
        if (currentTask) {
          currentTask.notes = noteBuffer
          tasks.push(currentTask)
        }
        noteBuffer = []

        const csiCode = taskMatch[1]
        const division = csiCode.substring(0, 2)
        currentTask = {
          csiCode,
          division,
          uom: taskMatch[2],
          description: taskMatch[3].replace(/\.{2,}/g, '').trim(),
          unitCost: parseNumber(taskMatch[4]),
          demoCost: taskMatch[5] ? parseNumber(taskMatch[5]) : null,
          modifiers: [],
          notes: [],
          parentRef: null,
        }
        continue
      }

      // Check for modifier line
      const modMatch = line.match(MODIFIER_RE)
      if (modMatch && currentTask) {
        currentTask.modifiers.push({
          condition: modMatch[1].trim(),
          type: modMatch[2].toUpperCase() === 'ADD' ? 'ADD' : 'DEDUCT',
          amount: parseNumber(modMatch[3]),
        })
        continue
      }

      // Also catch simpler modifier pattern: "For condition, Add  1.23" without comma after condition
      const modMatch2 = line.match(/^For\s+(.+?)\s*,?\s+(Add|Deduct)\s+(-?[\d,]+\.\d{2})\s*$/i)
      if (modMatch2 && currentTask && !taskMatch) {
        currentTask.modifiers.push({
          condition: modMatch2[1].trim(),
          type: modMatch2[2].toUpperCase() === 'ADD' ? 'ADD' : 'DEDUCT',
          amount: parseNumber(modMatch2[3]),
        })
        continue
      }

      // Note lines
      const noteMatch = line.match(NOTE_RE)
      if (noteMatch) {
        noteBuffer.push(noteMatch[1])
        continue
      }

      // Section headers (no pricing, just categorization) - skip these
      if (line.match(/^\d{2}\s+\d{2}/) && !line.match(/[\d,]+\.\d{2}/)) {
        continue
      }
    }
  }

  // Don't forget the last task
  if (currentTask) {
    currentTask.notes = noteBuffer
    tasks.push(currentTask)
  }

  return tasks
}

// ---------------------------------------------------------------------------
// Convert CSI code to compact task number: "03 01 30 51-0002" → "030130.51-0002"
// ---------------------------------------------------------------------------
function csiToTaskNumber(csiCode: string): string {
  // Keep the full CSI code as the task number for uniqueness
  return csiCode.replace(/\s+/g, '')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const pdfPath = path.resolve(__dirname, '../_docs/Construction Task Catalog® - Distribution.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error('CTC PDF not found at:', pdfPath)
    process.exit(1)
  }

  console.log('📖 Reading CTC PDF...')
  const buf = fs.readFileSync(pdfPath)
  const uint8 = new Uint8Array(buf)

  console.log('📄 Parsing PDF pages...')
  const parser = new PDFParse(uint8)
  await parser.load()
  const result = await parser.getText()
  const pages = result.pages as Array<{ text: string; num: number }>
  console.log(`   ${pages.length} pages extracted`)
  parser.destroy()

  console.log('🔍 Extracting tasks with regex parser...')
  const tasks = parsePages(pages)
  console.log(`   ${tasks.length} tasks found`)

  // Division summary
  const divCounts = new Map<string, number>()
  for (const t of tasks) {
    divCounts.set(t.division, (divCounts.get(t.division) || 0) + 1)
  }
  console.log('\n📊 Division breakdown:')
  for (const [div, count] of Array.from(divCounts.entries()).sort()) {
    console.log(`   Division ${div} (${CSI_DIVISIONS[div] || 'Unknown'}): ${count} tasks`)
  }

  // Modifier count
  const modCount = tasks.reduce((sum, t) => sum + t.modifiers.length, 0)
  console.log(`\n   Total modifiers: ${modCount}`)

  // Price stats
  const prices = tasks.map(t => t.unitCost).filter(p => p > 0)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  console.log(`   Price range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`)
  console.log(`   Average price: $${avgPrice.toFixed(2)}`)

  // Get or create CTC cost database
  console.log('\n💾 Setting up CTC cost database...')
  let costDb = await (prisma as any).costDatabase.findFirst({
    where: { source: 'CTC-Gordian-MD-DGS-2023' },
  })

  if (costDb) {
    // Delete existing CTC assemblies to reimport
    console.log('   Found existing CTC database, clearing old assemblies...')
    const deleted = await (prisma as any).assembly.deleteMany({
      where: { costDatabaseId: costDb.id, sourceDatabase: 'CTC-Gordian-MD-DGS-2023' },
    })
    console.log(`   Deleted ${deleted.count} old assemblies`)
  } else {
    costDb = await (prisma as any).costDatabase.create({
      data: {
        name: 'Construction Task Catalog (CTC) - MD DGS June 2023',
        description: 'Gordian CTC for Maryland Department of General Services JOC, 4,666 pages, all CSI divisions',
        region: 'MD-DC-VA',
        type: 'IMPORTED',
        tier: 'STANDARD',
        version: '2023-06',
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
    console.log(`   Created CTC database: ${costDb.id}`)
  }

  // Batch insert tasks
  console.log('\n📥 Importing tasks to database...')
  let imported = 0
  let errors = 0
  const batchSize = 50
  const startTime = Date.now()

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const createData = batch.map(task => {
      const lme = LME_RATIOS[task.division] || DEFAULT_LME
      const category = CSI_TO_CATEGORY[task.division] || 'OTHER_ASSEMBLY'
      const taskNumber = csiToTaskNumber(task.csiCode)

      // Format CSI code with spaces for display: "03 01 30"
      const csiDisplay = task.csiCode.replace(/(\d{2})\s*(\d{2})\s*(\d{2}).*/, '$1 $2 $3')

      return {
        costDatabaseId: costDb.id,
        csiCode: csiDisplay,
        name: task.description,
        description: task.notes.length > 0 ? task.notes.join(' ') : null,
        category,
        subcategory: CSI_DIVISIONS[task.division] || null,
        unit: task.uom,
        unitCost: task.unitCost,
        laborCost: Math.round(task.unitCost * lme.labor * 100) / 100,
        materialCost: Math.round(task.unitCost * lme.material * 100) / 100,
        equipmentCost: Math.round(task.unitCost * lme.equipment * 100) / 100,
        laborHours: 0,
        isActive: true,
        isTemplate: false,
        tags: ['ctc', `div-${task.division}`],
        notes: task.modifiers.length > 0
          ? task.modifiers.map(m => `${m.condition}: ${m.type} $${m.amount.toFixed(2)}`).join('; ')
          : null,
        metadata: {
          source: 'CTC-Gordian-MD-DGS-2023',
          taskNumber,
          fullCsiCode: task.csiCode,
          isModifier: false,
          modifierOf: null,
          modifierType: null,
          modifierValue: null,
          demoCost: task.demoCost,
          modifierCount: task.modifiers.length,
          modifiers: task.modifiers,
        },
        ctcTaskNumber: taskNumber,
        ctcModifierOf: null,
        sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
      }
    })

    try {
      const result = await (prisma as any).assembly.createMany({
        data: createData,
        skipDuplicates: true,
      })
      imported += result.count
    } catch (err: any) {
      // Fall back to individual creates on batch failure
      for (const data of createData) {
        try {
          await (prisma as any).assembly.create({ data })
          imported++
        } catch (e: any) {
          errors++
          if (errors <= 10) {
            console.error(`   Error: ${data.ctcTaskNumber} - ${e.message.substring(0, 80)}`)
          }
        }
      }
    }

    if (i % 500 === 0 || i + batchSize >= tasks.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const pct = Math.round((i / tasks.length) * 100)
      process.stdout.write(`\r   Progress: ${pct}% (${imported} imported, ${errors} errors) [${elapsed}s]`)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ CTC Import Complete!`)
  console.log(`   Tasks imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Time: ${totalTime}s`)
  console.log(`   Database: ${costDb.id}`)

  // Verify with a count
  const dbCount = await (prisma as any).assembly.count({
    where: { costDatabaseId: costDb.id },
  })
  console.log(`   Verified in DB: ${dbCount} assemblies`)

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
