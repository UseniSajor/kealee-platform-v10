// ============================================================
// GLOBAL TYPE DECLARATIONS
// ============================================================

// Type declarations for external packages that may not have types

declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: any;
    text: string;
    version: string;
  }

  function pdfParse(data: Buffer, options?: any): Promise<PDFData>;
  export = pdfParse;
}

declare module 'tesseract.js' {
  export interface Worker {
    recognize(image: Buffer | string): Promise<{
      data: {
        text: string;
        words: Array<{
          text: string;
          confidence: number;
          bbox: {
            x0: number;
            y0: number;
            x1: number;
            y1: number;
          };
        }>;
      };
    }>;
    setParameters(params: Record<string, string>): Promise<void>;
    terminate(): Promise<void>;
  }

  export function createWorker(language?: string): Promise<Worker>;
}
