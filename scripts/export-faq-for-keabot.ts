/**
 * Export FAQ records from the database for KeaBot knowledge base
 *
 * Reads all FAQ records ordered by number and writes them to a JSON file
 * that KeaBot can ingest as its FAQ knowledge base.
 *
 * Usage:
 *   cd kealee-platform-v10
 *   npx tsx scripts/export-faq-for-keabot.ts
 *
 * Output:
 *   scripts/output/keabot-faq-knowledge.json
 */

import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface KeaBotFaqEntry {
  question: string
  answer: string
  tags: string[]
  section: string
  sectionSlug: string
  number: number
}

async function exportFaqForKeaBot(): Promise<void> {
  const outputDir = path.join(__dirname, 'output')
  const outputFile = path.join(outputDir, 'keabot-faq-knowledge.json')

  try {
    // Ensure the output directory exists
    await mkdir(outputDir, { recursive: true })

    // Read all FAQ records ordered by number
    const faqs = await prisma.faq.findMany({
      orderBy: { number: 'asc' },
    })

    if (faqs.length === 0) {
      console.warn('No FAQ records found in the database. Is the database seeded?')
      process.exit(1)
    }

    // Map to the KeaBot knowledge base shape
    const keabotEntries: KeaBotFaqEntry[] = faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags,
      section: faq.section,
      sectionSlug: faq.sectionSlug,
      number: faq.number,
    }))

    // Write to JSON file
    await writeFile(outputFile, JSON.stringify(keabotEntries, null, 2), 'utf-8')

    console.log(`Successfully exported ${keabotEntries.length} FAQ entries to:`)
    console.log(`  ${outputFile}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to export FAQ data:', error.message)
    } else {
      console.error('Failed to export FAQ data:', error)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportFaqForKeaBot()
