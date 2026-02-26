/**
 * Bid Document Service
 * Upload and AI-powered processing of bid documents
 */

import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config'
import { prismaAny } from '../../utils/prisma-helper'
import { uploadFile } from '@kealee/storage'
import { bidService } from './bid.service'

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
})

// ── Types ──────────────────────────────────────────────────────────────────

export interface DocumentMetadata {
  documentType: string
  keyDates: string[]
  dollarAmounts: string[]
  scopeDetails: string[]
  mbeDbRequirements: string[]
  bondingInsurance: string[]
  contacts: string[]
  specialConditions: string[]
}

// ── Upload ─────────────────────────────────────────────────────────────────

export async function uploadBidDocument(opts: {
  bidId: string
  file: Buffer
  filename: string
  mimeType: string
  type?: string
  notes?: string
}): Promise<any> {
  // Verify bid exists
  const bid = await prismaAny.bidOpportunity.findUnique({ where: { id: opts.bidId } })
  if (!bid) throw new Error('Bid not found')

  // Upload to Supabase
  const safeName = opts.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
  const storagePath = `bids/${opts.bidId}/${Date.now()}-${safeName}`

  const { url } = await uploadFile({
    bucket: 'documents',
    path: storagePath,
    file: opts.file,
    contentType: opts.mimeType,
  })

  // Create BidDocument record
  const doc = await prismaAny.bidDocument.create({
    data: {
      bidId: opts.bidId,
      type: opts.type || 'OTHER',
      fileName: opts.filename,
      fileUrl: url,
      fileSize: opts.file.length,
      mimeType: opts.mimeType,
      notes: opts.notes,
    },
  })

  await bidService.logActivity(opts.bidId, 'DOCUMENT_UPLOADED', 'system', {
    documentId: doc.id,
    fileName: opts.filename,
    type: opts.type || 'OTHER',
  })

  return doc
}

// ── AI Processing ──────────────────────────────────────────────────────────

export async function processBidDocument(bidId: string, docId: string): Promise<any> {
  const doc = await prismaAny.bidDocument.findUnique({ where: { id: docId } })
  if (!doc) throw new Error('Document not found')
  if (doc.bidId !== bidId) throw new Error('Document does not belong to this bid')

  // If no API key, return basic metadata
  if (!config.anthropicApiKey) {
    console.warn('No Anthropic API key found. Skipping AI document processing.')
    const metadata = buildBasicMetadata(doc)
    await persistDocumentProcessing(docId, metadata, 'No AI processing — API key not configured')
    await bidService.logActivity(bidId, 'DOCUMENT_PROCESSED', 'system', {
      documentId: docId,
      method: 'basic',
    })
    return { document: doc, metadata, extractedText: null }
  }

  try {
    // Download the file content
    const fileResponse = await fetch(doc.fileUrl)
    if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.statusText}`)

    const isImage = (doc.mimeType || '').startsWith('image/')
    const model = config.anthropicModel || 'claude-sonnet-4-20250514'

    let extractedText = ''
    let metadata: DocumentMetadata

    if (isImage) {
      // Use Claude Vision for images
      const buffer = Buffer.from(await fileResponse.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mediaType = (doc.mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      const message = await anthropic.messages.create({
        model,
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: buildDocumentPrompt(doc),
            },
          ],
        }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        extractedText = content.text ?? ''
        metadata = parseDocumentResponse(content.text ?? '')
      } else {
        metadata = buildBasicMetadata(doc)
      }
    } else {
      // For text/PDF, send content as text
      const text = await fileResponse.text()
      extractedText = text.substring(0, 50000) // Limit content length

      const message = await anthropic.messages.create({
        model,
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `${buildDocumentPrompt(doc)}\n\nDocument content:\n${extractedText.substring(0, 30000)}`,
        }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        metadata = parseDocumentResponse(content.text ?? '')
      } else {
        metadata = buildBasicMetadata(doc)
      }
    }

    await persistDocumentProcessing(docId, metadata, extractedText)
    await bidService.logActivity(bidId, 'DOCUMENT_PROCESSED', 'system', {
      documentId: docId,
      method: 'ai',
      documentType: metadata.documentType,
    })

    return { document: doc, metadata, extractedText: extractedText.substring(0, 500) + '...' }
  } catch (error: any) {
    console.error('Document processing error:', error)
    const metadata = buildBasicMetadata(doc)
    await persistDocumentProcessing(docId, metadata, `Processing error: ${error.message}`)
    await bidService.logActivity(bidId, 'DOCUMENT_PROCESSED', 'system', {
      documentId: docId,
      method: 'error',
      error: error.message,
    })
    return { document: doc, metadata, extractedText: null, error: error.message }
  }
}

// ── List Documents ─────────────────────────────────────────────────────────

export async function listBidDocuments(bidId: string): Promise<any[]> {
  return prismaAny.bidDocument.findMany({
    where: { bidId },
    orderBy: { createdAt: 'desc' },
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildDocumentPrompt(doc: any): string {
  return `You are analyzing a construction bid document. Extract key information from this document.

Document: ${doc.fileName}
Type: ${doc.type}

Extract and return as JSON:
{
  "documentType": "Type of document (specs, drawings, addendum, bid form, etc.)",
  "keyDates": ["List of important dates found"],
  "dollarAmounts": ["List of dollar amounts found"],
  "scopeDetails": ["Key scope of work items"],
  "mbeDbRequirements": ["MBE/DBE participation requirements"],
  "bondingInsurance": ["Bonding and insurance requirements"],
  "contacts": ["Contact names, emails, phones found"],
  "specialConditions": ["Special conditions or requirements"]
}`
}

function parseDocumentResponse(text: string): DocumentMetadata {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        documentType: String(parsed.documentType || 'Unknown'),
        keyDates: Array.isArray(parsed.keyDates) ? parsed.keyDates.map(String) : [],
        dollarAmounts: Array.isArray(parsed.dollarAmounts) ? parsed.dollarAmounts.map(String) : [],
        scopeDetails: Array.isArray(parsed.scopeDetails) ? parsed.scopeDetails.map(String) : [],
        mbeDbRequirements: Array.isArray(parsed.mbeDbRequirements) ? parsed.mbeDbRequirements.map(String) : [],
        bondingInsurance: Array.isArray(parsed.bondingInsurance) ? parsed.bondingInsurance.map(String) : [],
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts.map(String) : [],
        specialConditions: Array.isArray(parsed.specialConditions) ? parsed.specialConditions.map(String) : [],
      }
    }
  } catch (e) {
    console.error('Failed to parse document AI response:', e)
  }
  return buildBasicMetadata({ type: 'OTHER' })
}

function buildBasicMetadata(doc: any): DocumentMetadata {
  return {
    documentType: doc.type || 'Unknown',
    keyDates: [],
    dollarAmounts: [],
    scopeDetails: [],
    mbeDbRequirements: [],
    bondingInsurance: [],
    contacts: [],
    specialConditions: [],
  }
}

async function persistDocumentProcessing(docId: string, metadata: DocumentMetadata, extractedText: string) {
  await prismaAny.bidDocument.update({
    where: { id: docId },
    data: {
      metadata: metadata as any,
      extractedText,
      processedAt: new Date(),
    },
  })
}
