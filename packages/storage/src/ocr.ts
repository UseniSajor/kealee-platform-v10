/**
 * OCR Processing Module
 * Uses Claude Vision as the primary OCR engine for receipts and permit documents.
 *
 * Integrates with:
 *   - APP-07 Budget Tracker: receipt data extraction → BudgetLine matching
 *   - APP-05 Permit Tracker: permit document data extraction
 */

import { getImageBase64 } from './image-processing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptOcrResult {
  vendor: string
  amount: number
  date: string
  category: string
  description: string
  lineItems?: Array<{ description: string; amount: number }>
  confidence: number
}

export interface PermitOcrResult {
  permitType: string
  jurisdiction: string
  address: string
  applicant: string
  status: string
  issueDate?: string
  expirationDate?: string
  conditions?: string[]
  confidence: number
}

/**
 * Callback type for the AI vision analysis function.
 * The storage package is AI-provider-agnostic: callers inject the actual
 * Claude / OpenAI call so we don't couple to a specific SDK.
 */
export type AnalyzeImageFn = (opts: {
  systemPrompt: string
  userPrompt: string
  imageBase64: string
  mediaType: string
}) => Promise<string>

// ---------------------------------------------------------------------------
// Receipt OCR
// ---------------------------------------------------------------------------

const RECEIPT_SYSTEM_PROMPT = `You are a receipt OCR specialist for a construction project management platform.
Extract the following from this receipt image:
- vendor: the store or vendor name
- amount: total amount as a number (e.g. 142.57)
- date: purchase date in ISO 8601 format (YYYY-MM-DD)
- category: one of "materials", "labor", "equipment", "permits", "subcontractor", "other"
- description: brief description of the purchase (max 100 chars)
- lineItems: if individual line items are visible, extract each as { "description": string, "amount": number }
- confidence: your confidence score from 0 to 1

Return ONLY valid JSON with these fields. No markdown, no explanation.`

const RECEIPT_USER_PROMPT = 'Extract all receipt data from this image.'

/**
 * Process a receipt image through Claude Vision OCR.
 *
 * 1. Downloads the file (or accepts a buffer)
 * 2. Converts to base64
 * 3. Calls the injected AI vision function
 * 4. Parses and validates the result
 * 5. Updates the FileUpload record with OCR data
 */
export async function processReceipt(
  documentId: string,
  deps: {
    prisma: any
    analyzeImage: AnalyzeImageFn
  }
): Promise<ReceiptOcrResult> {
  // Fetch the FileUpload record
  const record = await deps.prisma.fileUpload.findUnique({
    where: { id: documentId },
  })
  if (!record) {
    throw new Error(`FileUpload ${documentId} not found`)
  }

  // Get image as base64
  const { base64, mediaType } = await getImageBase64(record.fileUrl)

  // Call AI vision
  const rawResponse = await deps.analyzeImage({
    systemPrompt: RECEIPT_SYSTEM_PROMPT,
    userPrompt: RECEIPT_USER_PROMPT,
    imageBase64: base64,
    mediaType,
  })

  // Parse JSON response
  const parsed = parseJsonResponse<ReceiptOcrResult>(rawResponse)

  // Validate & coerce
  const result: ReceiptOcrResult = {
    vendor: String(parsed.vendor || 'Unknown'),
    amount: Number(parsed.amount) || 0,
    date: String(parsed.date || new Date().toISOString().split('T')[0]),
    category: String(parsed.category || 'other'),
    description: String(parsed.description || ''),
    lineItems: Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((li: any) => ({
          description: String(li.description || ''),
          amount: Number(li.amount) || 0,
        }))
      : undefined,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
  }

  // Update the FileUpload record
  await deps.prisma.fileUpload.update({
    where: { id: documentId },
    data: {
      ocrData: result as any,
      ocrProcessed: true,
      ocrProcessedAt: new Date(),
    },
  })

  return result
}

// ---------------------------------------------------------------------------
// Permit document OCR
// ---------------------------------------------------------------------------

const PERMIT_SYSTEM_PROMPT = `You are a construction permit document specialist.
Extract the following from this permit document image:
- permitType: type of permit (e.g. "Building Permit", "Electrical Permit", "Demolition Permit")
- jurisdiction: the issuing jurisdiction (city, county, or state)
- address: the property address on the permit
- applicant: the applicant name
- status: permit status (e.g. "APPROVED", "PENDING", "ISSUED", "EXPIRED")
- issueDate: issue date in ISO 8601 format (YYYY-MM-DD) if visible
- expirationDate: expiration date in ISO 8601 format (YYYY-MM-DD) if visible
- conditions: array of permit conditions or notes if visible
- confidence: your confidence score from 0 to 1

Return ONLY valid JSON with these fields. No markdown, no explanation.`

const PERMIT_USER_PROMPT = 'Extract all permit document data from this image.'

/**
 * Process a permit document through Claude Vision OCR.
 * Used by APP-05 Permit Tracker.
 */
export async function processPermitDocument(
  documentId: string,
  deps: {
    prisma: any
    analyzeImage: AnalyzeImageFn
  }
): Promise<PermitOcrResult> {
  const record = await deps.prisma.fileUpload.findUnique({
    where: { id: documentId },
  })
  if (!record) {
    throw new Error(`FileUpload ${documentId} not found`)
  }

  const { base64, mediaType } = await getImageBase64(record.fileUrl)

  const rawResponse = await deps.analyzeImage({
    systemPrompt: PERMIT_SYSTEM_PROMPT,
    userPrompt: PERMIT_USER_PROMPT,
    imageBase64: base64,
    mediaType,
  })

  const parsed = parseJsonResponse<PermitOcrResult>(rawResponse)

  const result: PermitOcrResult = {
    permitType: String(parsed.permitType || 'Unknown'),
    jurisdiction: String(parsed.jurisdiction || 'Unknown'),
    address: String(parsed.address || ''),
    applicant: String(parsed.applicant || ''),
    status: String(parsed.status || 'PENDING'),
    issueDate: parsed.issueDate ? String(parsed.issueDate) : undefined,
    expirationDate: parsed.expirationDate ? String(parsed.expirationDate) : undefined,
    conditions: Array.isArray(parsed.conditions)
      ? parsed.conditions.map(String)
      : undefined,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
  }

  // Update the FileUpload record
  await deps.prisma.fileUpload.update({
    where: { id: documentId },
    data: {
      ocrData: result as any,
      ocrProcessed: true,
      ocrProcessedAt: new Date(),
    },
  })

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a JSON response from the AI model, stripping markdown fences if present.
 */
function parseJsonResponse<T>(raw: string): T {
  let cleaned = raw.trim()

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }

  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.slice(0, 200)}`)
  }
}
