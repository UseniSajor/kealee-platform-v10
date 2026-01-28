// ============================================================
// DOCUMENT PROCESSOR (OCR)
// OCR fallback for scanned documents
// ============================================================

import Tesseract from 'tesseract.js';
import { IntegrationConfig, IntegrationResult, OCRConfig } from '../types';
import axios from 'axios';

export class DocumentProcessor {
  private config: OCRConfig;
  private worker: Tesseract.Worker | null = null;

  constructor(config: OCRConfig) {
    this.config = config;
  }

  /**
   * Initialize OCR worker
   */
  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker(this.config.language || 'eng');
      
      if (this.config.psm) {
        await this.worker.setParameters({
          tessedit_pageseg_mode: this.config.psm.toString() as Tesseract.PSM,
        });
      }
    }
  }

  /**
   * Process document with OCR
   */
  async processDocument(
    documentUrl: string
  ): Promise<IntegrationResult<{
    text: string;
    confidence: number;
    fields: Record<string, string>;
  }>> {
    const startTime = Date.now();

    try {
      await this.initialize();
      if (!this.worker) throw new Error('OCR worker not initialized');

      // Download document
      const response = await axios.get(documentUrl, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(response.data);

      // Perform OCR
      const { data } = await this.worker.recognize(buffer);

      // Extract fields
      const fields = this.extractFields(data.text);

      // Calculate confidence
      const confidences = data.words
        .map((w: any) => w.confidence)
        .filter((c: number) => c > 0);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length / 100
        : 0;

      return {
        success: true,
        data: {
          text: data.text,
          confidence: avgConfidence,
          fields,
        },
        tier: 'OCR',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'OCR processing failed',
        tier: 'OCR',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract structured fields from OCR text
   */
  private extractFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // Extract common patterns
    const patterns = {
      permitNumber: /(?:permit|application)\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i,
      date: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
      email: /\b[\w\.-]+@[\w\.-]+\.\w+\b/,
      phone: /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/,
      address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct)[\s,]+[\w\s,]+(?:,\s*)?[A-Z]{2}\s+\d{5}/i,
    };

    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        fields[field] = match[1] || match[0];
      }
    }

    return fields;
  }

  /**
   * Parse permit from OCR text
   */
  async parsePermitFromDocument(
    documentUrl: string
  ): Promise<IntegrationResult<{
    permitNumber?: string;
    status?: string;
    dates?: {
      submitted?: Date;
      approved?: Date;
      expires?: Date;
    };
  }>> {
    const ocrResult = await this.processDocument(documentUrl);

    if (!ocrResult.success || !ocrResult.data) {
      return {
        success: false,
        error: ocrResult.error || 'OCR processing failed',
        tier: 'OCR',
        provider: 'CUSTOM',
        processingTimeMs: ocrResult.processingTimeMs,
      };
    }

    const { text, fields } = ocrResult.data;

    // Parse permit information
    const permitNumber = fields.permitNumber || this.extractPermitNumber(text);
    const status = this.extractStatus(text);
    const dates = this.extractDates(text);

    return {
      success: true,
      data: {
        permitNumber,
        status,
        dates,
      },
      tier: 'OCR',
      provider: 'CUSTOM',
      processingTimeMs: ocrResult.processingTimeMs,
    };
  }

  /**
   * Extract permit number from text
   */
  private extractPermitNumber(text: string): string | undefined {
    const patterns = [
      /permit\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i,
      /application\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i,
      /\b([A-Z]{2,4}-\d{4}-\d{6})\b/,
      /\b(\d{4}-\d{6})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Extract status from text
   */
  private extractStatus(text: string): string | undefined {
    const lower = text.toLowerCase();
    
    if (lower.includes('approved') || lower.includes('issued')) return 'APPROVED';
    if (lower.includes('under review') || lower.includes('in review')) return 'UNDER_REVIEW';
    if (lower.includes('submitted') || lower.includes('received')) return 'SUBMITTED';
    if (lower.includes('rejected') || lower.includes('denied')) return 'REJECTED';
    
    return undefined;
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): {
    submitted?: Date;
    approved?: Date;
    expires?: Date;
  } {
    const dates: { submitted?: Date; approved?: Date; expires?: Date } = {};

    // Submitted date
    const submittedMatch = text.match(/(?:submitted|filed|received).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (submittedMatch) {
      dates.submitted = this.parseDate(submittedMatch[1]);
    }

    // Approved date
    const approvedMatch = text.match(/(?:approved|issued).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (approvedMatch) {
      dates.approved = this.parseDate(approvedMatch[1]);
    }

    // Expires date
    const expiresMatch = text.match(/(?:expires|expiration).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (expiresMatch) {
      dates.expires = this.parseDate(expiresMatch[1]);
    }

    return dates;
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }

  /**
   * Clean up worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
