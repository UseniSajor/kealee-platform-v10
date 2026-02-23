/**
 * OCR Service
 * Optical Character Recognition for scanned documents
 */

export interface OCRResult {
  text: string;
  confidence: number; // 0-1
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    boundingBoxes: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }>;
  metadata: {
    language: string;
    processingTime: number;
    isScanned: boolean;
  };
}

export interface OCROptions {
  language?: string; // 'en', 'es', etc.
  enhanceImage?: boolean;
  extractTables?: boolean;
  extractForms?: boolean;
}

export class OCRService {
  /**
   * Perform OCR on image or PDF
   */
  async performOCR(
    file: File | Blob,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const {
      language = 'en',
      enhanceImage = true,
      extractTables = false,
      extractForms = false,
    } = options;

    const startTime = Date.now();

    // Check file type
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      throw new Error('OCR only supports PDF and image files');
    }

    // For PDFs, extract pages as images first
    if (isPDF) {
      return this.ocrPDF(file, {language, enhanceImage, extractTables, extractForms});
    } else {
      return this.ocrImage(file, {language, enhanceImage});
    }
  }

  /**
   * OCR on PDF file
   */
  private async ocrPDF(
    file: File | Blob,
    options: OCROptions
  ): Promise<OCRResult> {
    // Load PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;

    const pages: OCRResult['pages'] = [];
    let allText = '';

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale: 2.0});

      // Render page to canvas
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Convert canvas to image and perform OCR
      const imageData = canvas.toDataURL('image/png');
      const pageResult = await this.ocrImageData(imageData, {
        language: options.language,
        enhanceImage: options.enhanceImage,
      });

      pages.push({
        pageNumber: i,
        text: pageResult.text,
        confidence: pageResult.confidence,
        boundingBoxes: pageResult.boundingBoxes,
      });

      allText += pageResult.text + '\n\n';
    }

    const processingTime = Date.now() - startTime;

    return {
      text: allText.trim(),
      confidence: pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length,
      pages,
      metadata: {
        language: options.language || 'en',
        processingTime,
        isScanned: true,
      },
    };
  }

  /**
   * OCR on image file
   */
  private async ocrImage(
    file: File | Blob,
    options: OCROptions
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    // Convert file to image data URL
    const imageData = await this.fileToDataURL(file);

    // Enhance image if requested
    let processedImage = imageData;
    if (options.enhanceImage) {
      processedImage = await this.enhanceImage(imageData);
    }

    // Perform OCR
    const result = await this.ocrImageData(processedImage, {
      language: options.language,
      enhanceImage: false, // Already enhanced
    });

    const processingTime = Date.now() - startTime;

    return {
      text: result.text,
      confidence: result.confidence,
      pages: [
        {
          pageNumber: 1,
          text: result.text,
          confidence: result.confidence,
          boundingBoxes: result.boundingBoxes,
        },
      ],
      metadata: {
        language: options.language || 'en',
        processingTime,
        isScanned: true,
      },
    };
  }

  /**
   * Perform OCR on image data
   */
  private async ocrImageData(
    imageData: string,
    options: {language?: string; enhanceImage?: boolean}
  ): Promise<{
    text: string;
    confidence: number;
    boundingBoxes: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }> {
    // In production, this would use:
    // - Tesseract.js (client-side)
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Or a server-side OCR service

    // For now, use Tesseract.js as an example
    try {
      const Tesseract = await import('tesseract.js');
      
      const worker = await Tesseract.createWorker(options.language || 'eng');
      
      const {data} = await worker.recognize(imageData);
      
      await worker.terminate();

      // Extract bounding boxes
      const boundingBoxes = data.words.map((word: any) => ({
        text: word.text,
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
      }));

      return {
        text: data.text,
        confidence: data.confidence / 100, // Convert to 0-1
        boundingBoxes,
      };
    } catch (error) {
      console.error('OCR error:', error);
      
      // Fallback: return empty result
      return {
        text: '',
        confidence: 0,
        boundingBoxes: [],
      };
    }
  }

  /**
   * Enhance image for better OCR
   */
  private async enhanceImage(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData);
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Apply image enhancement
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // Convert to grayscale and enhance contrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Enhance contrast
          const enhanced = Math.min(255, gray * 1.2);
          
          data[i] = enhanced; // R
          data[i + 1] = enhanced; // G
          data[i + 2] = enhanced; // B
          // Alpha stays the same
        }

        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  }

  /**
   * Convert file to data URL
   */
  private fileToDataURL(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if file needs OCR
   */
  async needsOCR(file: File): Promise<boolean> {
    // Check file type
    if (file.type === 'application/pdf') {
      // Analyze PDF to see if it has text layers
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
        const pdf = await loadingTask.promise;

        // Check first page for text
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        // If no text or very little text, needs OCR
        return textContent.items.length < 10;
      } catch {
        return true; // If can't parse, assume needs OCR
      }
    }

    // Images always need OCR (they're scanned)
    return file.type.startsWith('image/');
  }
}

// Singleton instance
export const ocrService = new OCRService();
