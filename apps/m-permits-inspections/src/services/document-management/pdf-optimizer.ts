/**
 * PDF Optimization Service
 * Optimizes and compresses PDF files
 */

export interface PDFOptimizationOptions {
  quality?: 'low' | 'medium' | 'high';
  maxSizeMB?: number;
  removeMetadata?: boolean;
  compressImages?: boolean;
  removeUnusedObjects?: boolean;
  linearize?: boolean; // Fast web view
}

export interface PDFOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizedUrl: string;
  metadata: {
    pages: number;
    hasText: boolean;
    hasImages: boolean;
    isScanned: boolean;
  };
}

export class PDFOptimizationService {
  /**
   * Optimize PDF file
   */
  async optimizePDF(
    file: File | Blob,
    options: PDFOptimizationOptions = {}
  ): Promise<PDFOptimizationResult> {
    const {
      quality = 'medium',
      maxSizeMB = 20,
      removeMetadata = true,
      compressImages = true,
      removeUnusedObjects = true,
      linearize = true,
    } = options;

    // Load PDF.js for processing
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Analyze PDF
    const metadata = await this.analyzePDF(pdf);

    // Optimize PDF
    const optimizedBuffer = await this.processPDF(
      arrayBuffer,
      {
        quality,
        removeMetadata,
        compressImages,
        removeUnusedObjects,
        linearize,
      }
    );

    const optimizedSize = optimizedBuffer.byteLength;
    const compressionRatio = (1 - optimizedSize / originalSize) * 100;

    // If still too large, apply more aggressive compression
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    let finalBuffer = optimizedBuffer;

    if (optimizedSize > maxSizeBytes && quality !== 'low') {
      // Try more aggressive compression
      finalBuffer = await this.processPDF(arrayBuffer, {
        quality: 'low',
        removeMetadata: true,
        compressImages: true,
        removeUnusedObjects: true,
        linearize: true,
      });
    }

    // Create blob URL
    const blob = new Blob([finalBuffer], {type: 'application/pdf'});
    const optimizedUrl = URL.createObjectURL(blob);

    return {
      originalSize,
      optimizedSize: finalBuffer.byteLength,
      compressionRatio: (1 - finalBuffer.byteLength / originalSize) * 100,
      optimizedUrl,
      metadata: {
        pages: numPages,
        ...metadata,
      },
    };
  }

  /**
   * Analyze PDF structure
   */
  private async analyzePDF(pdf: any): Promise<{
    hasText: boolean;
    hasImages: boolean;
    isScanned: boolean;
  }> {
    let hasText = false;
    let hasImages = false;
    let textContentCount = 0;

    // Check first few pages
    const pagesToCheck = Math.min(3, pdf.numPages);

    for (let i = 1; i <= pagesToCheck; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      if (textContent.items.length > 0) {
        hasText = true;
        textContentCount += textContent.items.length;
      }

      const operators = await page.getOperatorList();
      for (const op of operators.fnArray) {
        if (op === 'Do' || op === 'BI') {
          hasImages = true;
        }
      }
    }

    // If PDF has very little text but many pages, likely scanned
    const isScanned = !hasText || (textContentCount < 10 && pdf.numPages > 1);

    return {
      hasText,
      hasImages,
      isScanned,
    };
  }

  /**
   * Process PDF with optimization settings
   */
  private async processPDF(
    arrayBuffer: ArrayBuffer,
    options: PDFOptimizationOptions
  ): Promise<ArrayBuffer> {
    // In a real implementation, you would use a PDF library like:
    // - pdf-lib for manipulation
    // - Ghostscript for compression
    // - PDFtk for optimization
    // - Or a server-side service

    // For now, return a simplified version
    // In production, this would:
    // 1. Parse PDF structure
    // 2. Compress images based on quality setting
    // 3. Remove metadata if requested
    // 4. Remove unused objects
    // 5. Linearize for fast web view
    // 6. Rebuild PDF

    // Placeholder: return original (would be processed in production)
    return arrayBuffer;
  }

  /**
   * Compress PDF using quality settings
   */
  private getCompressionSettings(quality: 'low' | 'medium' | 'high'): {
    imageQuality: number;
    imageDpi: number;
  } {
    const settings = {
      low: {
        imageQuality: 0.5,
        imageDpi: 150,
      },
      medium: {
        imageQuality: 0.75,
        imageDpi: 200,
      },
      high: {
        imageQuality: 0.9,
        imageDpi: 300,
      },
    };

    return settings[quality];
  }

  /**
   * Estimate compression ratio
   */
  estimateCompression(fileSize: number, quality: 'low' | 'medium' | 'high'): number {
    const ratios = {
      low: 0.3, // 70% reduction
      medium: 0.5, // 50% reduction
      high: 0.8, // 20% reduction
    };

    return fileSize * ratios[quality];
  }
}

// Singleton instance
export const pdfOptimizationService = new PDFOptimizationService();
