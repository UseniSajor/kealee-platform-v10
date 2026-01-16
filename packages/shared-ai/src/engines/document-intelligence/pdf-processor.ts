// ============================================================
// DOCUMENT INTELLIGENCE - PDF PROCESSOR
// PDF parsing and text extraction
// ============================================================

import pdfParse from 'pdf-parse';
import axios from 'axios';
import { AIResult, DocumentMetadata } from '../../types';

export class PDFProcessor {
  /**
   * Process PDF from URL or buffer
   */
  async processPDF(
    source: string | Buffer
  ): Promise<AIResult<{
    text: string;
    metadata: DocumentMetadata;
    pages: Array<{ pageNumber: number; text: string }>;
  }>> {
    const startTime = Date.now();

    try {
      let buffer: Buffer;

      if (typeof source === 'string') {
        // Fetch from URL
        const response = await axios.get(source, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        buffer = Buffer.from(response.data);
      } else {
        buffer = source;
      }

      const data = await pdfParse(buffer);

      const metadata: DocumentMetadata = {
        title: data.info?.Title,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
        pageCount: data.numpages,
        fileSize: buffer.length,
        mimeType: 'application/pdf',
        extractedText: data.text,
        language: this.detectLanguage(data.text)
      };

      // Split text by pages (simplified - pdf-parse doesn't always provide page-level text)
      const pages = Array.from({ length: data.numpages }, (_, i) => ({
        pageNumber: i + 1,
        text: this.extractPageText(data.text, i + 1, data.numpages) || ''
      }));

      return {
        success: true,
        data: {
          text: data.text,
          metadata,
          pages
        },
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF processing failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Extract text from specific page range
   */
  async extractPageRange(
    source: string | Buffer,
    startPage: number,
    endPage: number
  ): Promise<AIResult<string>> {
    const result = await this.processPDF(source);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error
      };
    }

    const pages = result.data.pages
      .filter(p => p.pageNumber >= startPage && p.pageNumber <= endPage)
      .map(p => p.text)
      .join('\n\n');

    return {
      success: true,
      data: pages,
      processingTimeMs: result.processingTimeMs
    };
  }

  /**
   * Check if PDF is searchable (has text layer)
   */
  async isSearchablePDF(
    source: string | Buffer
  ): Promise<AIResult<boolean>> {
    const result = await this.processPDF(source);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error
      };
    }

    // Simple heuristic: if text length is very short relative to page count,
    // it's likely scanned/image-based
    const textLength = result.data.text.length;
    const pageCount = result.data.metadata.pageCount;
    const avgTextPerPage = textLength / pageCount;

    // Threshold: less than 100 chars per page suggests scanned PDF
    const isSearchable = avgTextPerPage > 100;

    return {
      success: true,
      data: isSearchable,
      processingTimeMs: result.processingTimeMs
    };
  }

  /**
   * Extract page text (simplified - would need better PDF parsing library for accurate page extraction)
   */
  private extractPageText(
    fullText: string,
    pageNumber: number,
    totalPages: number
  ): string {
    // This is a simplified approach
    // For production, use a library that provides page-level text extraction
    const lines = fullText.split('\n');
    const linesPerPage = Math.ceil(lines.length / totalPages);
    const startLine = (pageNumber - 1) * linesPerPage;
    const endLine = pageNumber * linesPerPage;
    
    return lines.slice(startLine, endLine).join('\n');
  }

  /**
   * Detect language from text (simplified)
   */
  private detectLanguage(text: string): string {
    // Simplified language detection
    // For production, use a proper language detection library
    if (text.length < 50) return 'unknown';
    
    // Basic heuristics
    const englishPattern = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishPattern = /\b(el|la|los|las|de|en|y|o|pero|con|por)\b/gi;
    
    const englishMatches = text.match(englishPattern)?.length || 0;
    const spanishMatches = text.match(spanishPattern)?.length || 0;
    
    if (englishMatches > spanishMatches && englishMatches > 5) return 'en';
    if (spanishMatches > englishMatches && spanishMatches > 5) return 'es';
    
    return 'en'; // Default to English
  }
}
