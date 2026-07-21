// ============================================================
// DOCUMENT INTELLIGENCE - OCR ENGINE
// Optical Character Recognition for scanned documents
// ============================================================

import Tesseract from 'tesseract.js';
import axios from 'axios';
import sharp from 'sharp';
import { AIResult } from '../../types';

export class OCREngine {
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialize OCR worker
   */
  async initialize(language: string = 'eng'): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker(language);
    }
  }

  /**
   * Perform OCR on image URL or buffer
   */
  async extractText(
    source: string | Buffer,
    options?: {
      language?: string;
      psm?: number; // Page segmentation mode
      oem?: number; // OCR engine mode
    }
  ): Promise<AIResult<{
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }>> {
    const startTime = Date.now();

    try {
      await this.initialize(options?.language);

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      let imageBuffer: Buffer;

      if (typeof source === 'string') {
        // Fetch image from URL
        const response = await axios.get(source, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        imageBuffer = source;
      }

      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer);

      // Configure OCR options
      if (options?.psm) {
        await this.worker.setParameters({
          tessedit_pageseg_mode: options.psm.toString()
        });
      }

      // Perform OCR
      const { data } = await this.worker.recognize(processedImage);

      // Calculate average confidence
      const confidences = data.words
        .map((w: any) => w.confidence)
        .filter((c: number) => c > 0);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length / 100
        : 0;

      const words = data.words.map((word: any) => ({
        text: word.text,
        confidence: word.confidence / 100,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        }
      }));

      return {
        success: true,
        data: {
          text: data.text,
          confidence: avgConfidence,
          words
        },
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Extract text from PDF pages (requires converting PDF pages to images first)
   */
  async extractTextFromPDFPages(
    pdfPages: Buffer[],
    language?: string
  ): Promise<AIResult<Array<{
    pageNumber: number;
    text: string;
    confidence: number;
  }>>> {
    const results = [];

    for (let i = 0; i < pdfPages.length; i++) {
      const result = await this.extractText(pdfPages[i], { language });
      
      if (result.success && result.data) {
        results.push({
          pageNumber: i + 1,
          text: result.data.text,
          confidence: result.data.confidence
        });
      }
    }

    const avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

    return {
      success: results.length > 0,
      data: results,
      confidence: avgConfidence
    };
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(
    imageBuffer: Buffer
  ): Promise<Buffer> {
    try {
      // Convert to grayscale, enhance contrast, and resize if needed
      const processed = await sharp(imageBuffer)
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();

      return processed;
    } catch (error) {
      // If processing fails, return original
      return imageBuffer;
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
