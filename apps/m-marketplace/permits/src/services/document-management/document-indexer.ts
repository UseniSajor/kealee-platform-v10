/**
 * Document Indexing Service
 * Automated document indexing and metadata extraction
 */

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: Date;
  modificationDate?: Date;
  creator?: string;
  producer?: string;
  pageCount?: number;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
  extractedData?: {
    permitNumber?: string;
    address?: string;
    projectName?: string;
    contractorName?: string;
    licenseNumber?: string;
    dates?: Date[];
    measurements?: Array<{value: number; unit: string}>;
  };
}

export interface IndexedDocument {
  id: string;
  permitId: string;
  documentType: string;
  metadata: DocumentMetadata;
  searchableText: string;
  indexedAt: Date;
  version: number;
}

export class DocumentIndexingService {
  /**
   * Index document and extract metadata
   */
  async indexDocument(
    file: File | Blob,
    permitId: string,
    documentType: string,
    options?: {
      performOCR?: boolean;
      extractStructuredData?: boolean;
    }
  ): Promise<IndexedDocument> {
    const {performOCR = true, extractStructuredData = true} = options || {};

    // Extract basic metadata
    const metadata = await this.extractMetadata(file);

    // Extract text content
    let searchableText = '';
    if (file.type === 'application/pdf') {
      searchableText = await this.extractPDFText(file);
      
      // If no text found and OCR enabled, perform OCR
      if (!searchableText.trim() && performOCR) {
        const {ocrService} = await import('./ocr-service');
        const ocrResult = await ocrService.performOCR(file);
        searchableText = ocrResult.text;
        metadata.extractedText = ocrResult.text;
      }
    } else if (file.type.startsWith('image/') && performOCR) {
      const {ocrService} = await import('./ocr-service');
      const ocrResult = await ocrService.performOCR(file);
      searchableText = ocrResult.text;
      metadata.extractedText = ocrResult.text;
    }

    // Extract structured data
    if (extractStructuredData && searchableText) {
      metadata.extractedData = this.extractStructuredData(searchableText, documentType);
    }

    return {
      id: `index-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      permitId,
      documentType,
      metadata,
      searchableText,
      indexedAt: new Date(),
      version: 1,
    };
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: File | Blob): Promise<DocumentMetadata> {
    const metadata: DocumentMetadata = {
      fileSize: file.size,
      mimeType: file instanceof File ? file.type : 'application/octet-stream',
    };

    // For PDFs, extract PDF metadata
    if (file.type === 'application/pdf') {
      const pdfMetadata = await this.extractPDFMetadata(file);
      Object.assign(metadata, pdfMetadata);
    } else if (file instanceof File) {
      // Extract from file properties
      metadata.creationDate = new Date(file.lastModified);
      metadata.modificationDate = new Date(file.lastModified);
    }

    return metadata;
  }

  /**
   * Extract PDF metadata
   */
  private async extractPDFMetadata(file: File | Blob): Promise<Partial<DocumentMetadata>> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;

      const pdfMetadata = await pdf.getMetadata();

      return {
        title: pdfMetadata.info?.Title,
        author: pdfMetadata.info?.Author,
        subject: pdfMetadata.info?.Subject,
        keywords: pdfMetadata.info?.Keywords?.split(',').map(k => k.trim()),
        creationDate: pdfMetadata.info?.CreationDate
          ? new Date(pdfMetadata.info.CreationDate)
          : undefined,
        modificationDate: pdfMetadata.info?.ModDate
          ? new Date(pdfMetadata.info.ModDate)
          : undefined,
        creator: pdfMetadata.info?.Creator,
        producer: pdfMetadata.info?.Producer,
        pageCount: pdf.numPages,
      };
    } catch (error) {
      console.error('Error extracting PDF metadata:', error);
      return {};
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractPDFText(file: File | Blob): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  }

  /**
   * Extract structured data from text
   */
  private extractStructuredData(
    text: string,
    documentType: string
  ): DocumentMetadata['extractedData'] {
    const data: DocumentMetadata['extractedData'] = {};

    // Extract permit number (various formats)
    const permitNumberMatch = text.match(
      /(?:permit|permit\s*#|permit\s*number)[\s:]*([A-Z0-9-]+)/i
    );
    if (permitNumberMatch) {
      data.permitNumber = permitNumberMatch[1];
    }

    // Extract address
    const addressMatch = text.match(
      /\d+\s+[A-Z][a-z]+(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl))[^,\n]*(?:,\s*[A-Z][a-z]+)?(?:\s+[A-Z]{2})?\s+\d{5}(?:-\d{4})?/i
    );
    if (addressMatch) {
      data.address = addressMatch[0];
    }

    // Extract project name
    const projectMatch = text.match(
      /(?:project|project\s*name)[\s:]*([A-Z][^,\n]{5,50})/i
    );
    if (projectMatch) {
      data.projectName = projectMatch[1].trim();
    }

    // Extract contractor name
    const contractorMatch = text.match(
      /(?:contractor|contractor\s*name)[\s:]*([A-Z][^,\n]{5,50})/i
    );
    if (contractorMatch) {
      data.contractorName = contractorMatch[1].trim();
    }

    // Extract license number
    const licenseMatch = text.match(
      /(?:license|license\s*#|license\s*number)[\s:]*([A-Z0-9-]+)/i
    );
    if (licenseMatch) {
      data.licenseNumber = licenseMatch[1];
    }

    // Extract dates
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
    const dates: Date[] = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(text)) !== null) {
      const date = this.parseDate(dateMatch[1]);
      if (date) {
        dates.push(date);
      }
    }
    if (dates.length > 0) {
      data.dates = dates;
    }

    // Extract measurements (e.g., "10 ft", "5.5 inches")
    const measurementPattern = /(\d+\.?\d*)\s*(ft|feet|in|inch|inches|yd|yard|yards|m|meter|meters|cm|centimeter|centimeters)/gi;
    const measurements: Array<{value: number; unit: string}> = [];
    let measurementMatch;
    while ((measurementMatch = measurementPattern.exec(text)) !== null) {
      measurements.push({
        value: parseFloat(measurementMatch[1]),
        unit: measurementMatch[2],
      });
    }
    if (measurements.length > 0) {
      data.measurements = measurements;
    }

    return data;
  }

  /**
   * Parse date string
   */
  private parseDate(dateString: string): Date | null {
    try {
      // Try various date formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // MM/DD/YY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      ];

      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          if (format === formats[0] || format === formats[1]) {
            // MM/DD/YYYY or MM/DD/YY
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            let year = parseInt(match[3]);
            if (year < 100) {
              year += 2000; // Convert YY to YYYY
            }
            return new Date(year, month, day);
          } else if (format === formats[2]) {
            // YYYY-MM-DD
            return new Date(dateString);
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Search indexed documents
   */
  async searchDocuments(
    query: string,
    filters?: {
      permitId?: string;
      documentType?: string;
      dateRange?: {start: Date; end: Date};
    }
  ): Promise<IndexedDocument[]> {
    // In production, this would query a search index (Elasticsearch, Algolia, etc.)
    // For now, return empty array
    return [];
  }
}

// Singleton instance
export const documentIndexingService = new DocumentIndexingService();
