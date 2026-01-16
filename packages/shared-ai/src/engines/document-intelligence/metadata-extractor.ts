// ============================================================
// DOCUMENT INTELLIGENCE - METADATA EXTRACTOR
// Extract structured data from documents
// ============================================================

import OpenAI from 'openai';
import { PDFProcessor } from './pdf-processor';
import { OCREngine } from './ocr-engine';
import { AIResult, DocumentMetadata, ExtractedField, DocumentIntelligenceResult } from '../../types';

export class MetadataExtractor {
  private openai: OpenAI | null = null;
  private pdfProcessor: PDFProcessor;
  private ocrEngine: OCREngine;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.pdfProcessor = new PDFProcessor();
    this.ocrEngine = new OCREngine();
    
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Extract all metadata and structured data from document
   */
  async extractAll(
    documentUrl: string,
    schema?: {
      fields?: Array<{
        name: string;
        description: string;
        type: 'text' | 'number' | 'date' | 'boolean';
      }>;
    }
  ): Promise<AIResult<DocumentIntelligenceResult>> {
    const startTime = Date.now();

    try {
      // First, process PDF
      const pdfResult = await this.pdfProcessor.processPDF(documentUrl);
      
      if (!pdfResult.success || !pdfResult.data) {
        // Try OCR if PDF processing failed (might be scanned)
        const ocrResult = await this.ocrEngine.extractText(documentUrl);
        
        if (!ocrResult.success || !ocrResult.data) {
          return {
            success: false,
            error: 'Failed to extract text from document',
            processingTimeMs: Date.now() - startTime
          };
        }

        // Use OCR result
        const metadata: DocumentMetadata = {
          pageCount: 1, // Unknown from OCR
          fileSize: 0,
          mimeType: 'image',
          extractedText: ocrResult.data.text,
          ocrConfidence: ocrResult.data.confidence,
          language: 'en'
        };

        const fields = schema
          ? await this.extractFieldsWithSchema(ocrResult.data.text, schema)
          : [];

        return {
          success: true,
          data: {
            metadata,
            fields,
            textBlocks: [{
              text: ocrResult.data.text,
              page: 1,
              type: 'paragraph'
            }]
          },
          confidence: ocrResult.data.confidence,
          processingTimeMs: Date.now() - startTime
        };
      }

      // Use PDF result
      const metadata = pdfResult.data.metadata;
      let text = pdfResult.data.text;

      // If text is very short, try OCR
      if (text.length < 100 && pdfResult.data.metadata.pageCount > 0) {
        const ocrResult = await this.ocrEngine.extractText(documentUrl);
        if (ocrResult.success && ocrResult.data) {
          text = ocrResult.data.text;
          metadata.ocrConfidence = ocrResult.data.confidence;
        }
      }

      // Extract fields using AI if schema provided
      const fields = schema
        ? await this.extractFieldsWithSchema(text, schema)
        : await this.extractFieldsAuto(text);

      // Extract text blocks
      const textBlocks = pdfResult.data.pages.map(page => ({
        text: page.text,
        page: page.pageNumber,
        type: this.classifyTextBlock(page.text) as 'paragraph' | 'heading' | 'list' | 'table'
      }));

      return {
        success: true,
        data: {
          metadata,
          fields,
          textBlocks
        },
        confidence: metadata.ocrConfidence || 0.9,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metadata extraction failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Extract fields using provided schema
   */
  private async extractFieldsWithSchema(
    text: string,
    schema: {
      fields?: Array<{
        name: string;
        description: string;
        type: 'text' | 'number' | 'date' | 'boolean';
      }>;
    }
  ): Promise<ExtractedField[]> {
    if (!this.openai || !schema.fields) {
      return [];
    }

    try {
      const prompt = `Extract the following fields from this document text:

${schema.fields.map(f => `- ${f.name} (${f.type}): ${f.description}`).join('\n')}

Document text:
${text.substring(0, 4000)} // Limit text length

Return a JSON object with the field names as keys and extracted values.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a document data extraction expert. Extract structured data from documents accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      const extracted = JSON.parse(content);
      const fields: ExtractedField[] = [];

      schema.fields.forEach(field => {
        const value = extracted[field.name];
        if (value !== undefined && value !== null) {
          fields.push({
            name: field.name,
            value: this.convertValue(value, field.type),
            confidence: 0.8, // Could be improved with confidence scoring
            page: 1 // Would need page tracking
          });
        }
      });

      return fields;
    } catch (error) {
      console.error('Field extraction failed:', error);
      return [];
    }
  }

  /**
   * Auto-extract common fields
   */
  private async extractFieldsAuto(text: string): Promise<ExtractedField[]> {
    const fields: ExtractedField[] = [];

    // Extract common patterns
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
    const emailPattern = /\b[\w\.-]+@[\w\.-]+\.\w+\b/g;
    const phonePattern = /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g;

    // Extract dates
    const dates = text.match(datePattern);
    if (dates) {
      fields.push({
        name: 'dates',
        value: dates[0],
        confidence: 0.7,
        page: 1
      });
    }

    // Extract emails
    const emails = text.match(emailPattern);
    if (emails) {
      fields.push({
        name: 'email',
        value: emails[0],
        confidence: 0.9,
        page: 1
      });
    }

    // Extract phone numbers
    const phones = text.match(phonePattern);
    if (phones) {
      fields.push({
        name: 'phone',
        value: phones[0],
        confidence: 0.8,
        page: 1
      });
    }

    return fields;
  }

  /**
   * Convert extracted value to appropriate type
   */
  private convertValue(
    value: any,
    type: 'text' | 'number' | 'date' | 'boolean'
  ): string | number | boolean | Date {
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'boolean':
        return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
      case 'date':
        return value instanceof Date ? value : new Date(value);
      default:
        return String(value);
    }
  }

  /**
   * Classify text block type
   */
  private classifyTextBlock(text: string): string {
    if (text.length < 50 && text.split('\n').length === 1) {
      return 'heading';
    }
    if (text.match(/^\s*[-•*]\s/m)) {
      return 'list';
    }
    if (text.match(/\|/)) {
      return 'table';
    }
    return 'paragraph';
  }
}
