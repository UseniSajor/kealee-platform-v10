/**
 * File Type Recognition Service
 * Intelligent file type recognition and validation
 */

export interface FileTypeInfo {
  mimeType: string;
  extension: string;
  category: 'image' | 'pdf' | 'cad' | 'spreadsheet' | 'text' | 'other';
  isValid: boolean;
  confidence: number; // 0-1
  requiresOCR?: boolean;
  canOptimize?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileType: FileTypeInfo;
  sizeMB: number;
  maxSizeMB: number;
}

export class FileTypeRecognitionService {
  private readonly MIME_TYPES: Record<string, FileTypeInfo> = {
    // PDFs
    'application/pdf': {
      mimeType: 'application/pdf',
      extension: 'pdf',
      category: 'pdf',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false, // Will be determined by content analysis
      canOptimize: true,
    },
    // Images
    'image/jpeg': {
      mimeType: 'image/jpeg',
      extension: 'jpg',
      category: 'image',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: true,
    },
    'image/jpg': {
      mimeType: 'image/jpeg',
      extension: 'jpg',
      category: 'image',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: true,
    },
    'image/png': {
      mimeType: 'image/png',
      extension: 'png',
      category: 'image',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: true,
    },
    'image/tiff': {
      mimeType: 'image/tiff',
      extension: 'tiff',
      category: 'image',
      isValid: true,
      confidence: 1.0,
      requiresOCR: true, // TIFF often used for scanned documents
      canOptimize: true,
    },
    'image/tif': {
      mimeType: 'image/tiff',
      extension: 'tif',
      category: 'image',
      isValid: true,
      confidence: 1.0,
      requiresOCR: true,
      canOptimize: true,
    },
    // CAD files
    'application/acad': {
      mimeType: 'application/acad',
      extension: 'dwg',
      category: 'cad',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
    'application/x-dwg': {
      mimeType: 'application/x-dwg',
      extension: 'dwg',
      category: 'cad',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
    'application/dxf': {
      mimeType: 'application/dxf',
      extension: 'dxf',
      category: 'cad',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
    // Spreadsheets
    'application/vnd.ms-excel': {
      mimeType: 'application/vnd.ms-excel',
      extension: 'xls',
      category: 'spreadsheet',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      category: 'spreadsheet',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
    // Text
    'text/plain': {
      mimeType: 'text/plain',
      extension: 'txt',
      category: 'text',
      isValid: true,
      confidence: 1.0,
      requiresOCR: false,
      canOptimize: false,
    },
  };

  private readonly MAX_FILE_SIZES: Record<string, number> = {
    pdf: 50, // 50 MB
    image: 30, // 30 MB
    cad: 100, // 100 MB
    spreadsheet: 20, // 20 MB
    text: 10, // 10 MB
    other: 50, // 50 MB default
  };

  /**
   * Recognize file type from file
   */
  async recognizeFileType(file: File): Promise<FileTypeInfo> {
    // First, check by extension
    const extension = this.getFileExtension(file.name);
    const mimeType = file.type;

    // Try to match by MIME type
    let fileType = this.MIME_TYPES[mimeType];

    // If not found, try to match by extension
    if (!fileType) {
      fileType = this.matchByExtension(extension);
    }

    // If still not found, use default
    if (!fileType) {
      fileType = {
        mimeType: mimeType || 'application/octet-stream',
        extension,
        category: 'other',
        isValid: false,
        confidence: 0.5,
        requiresOCR: false,
        canOptimize: false,
      };
    }

    // Analyze file content for better detection (if needed)
    if (fileType.category === 'pdf') {
      const needsOCR = await this.analyzePDFForOCR(file);
      fileType.requiresOCR = needsOCR;
    }

    return fileType;
  }

  /**
   * Validate file
   */
  async validateFile(
    file: File,
    allowedTypes?: string[],
    maxSizeMB?: number
  ): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fileType = await this.recognizeFileType(file);
    const sizeMB = file.size / (1024 * 1024);
    const maxSize = maxSizeMB || this.MAX_FILE_SIZES[fileType.category] || 50;

    // Check file type
    if (!fileType.isValid) {
      errors.push(`File type ${fileType.mimeType} is not supported`);
    }

    // Check allowed types
    if (allowedTypes && !allowedTypes.includes(fileType.extension)) {
      errors.push(
        `File type .${fileType.extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Check file size
    if (sizeMB > maxSize) {
      errors.push(
        `File size (${sizeMB.toFixed(2)}MB) exceeds maximum (${maxSize}MB)`
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Warnings
    if (fileType.category === 'image' && sizeMB > 10) {
      warnings.push('Large image file. Consider compressing before upload.');
    }

    if (fileType.category === 'pdf' && sizeMB > 20) {
      warnings.push('Large PDF file. Consider optimizing before upload.');
    }

    if (fileType.requiresOCR) {
      warnings.push('This file may require OCR processing for text extraction.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fileType,
      sizeMB,
      maxSizeMB: maxSize,
    };
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Match file type by extension
   */
  private matchByExtension(extension: string): FileTypeInfo | undefined {
    const extensionMap: Record<string, FileTypeInfo> = {
      pdf: this.MIME_TYPES['application/pdf'],
      jpg: this.MIME_TYPES['image/jpeg'],
      jpeg: this.MIME_TYPES['image/jpeg'],
      png: this.MIME_TYPES['image/png'],
      tiff: this.MIME_TYPES['image/tiff'],
      tif: this.MIME_TYPES['image/tiff'],
      dwg: this.MIME_TYPES['application/acad'] || {
        mimeType: 'application/acad',
        extension: 'dwg',
        category: 'cad',
        isValid: true,
        confidence: 0.9,
        requiresOCR: false,
        canOptimize: false,
      },
      dxf: this.MIME_TYPES['application/dxf'] || {
        mimeType: 'application/dxf',
        extension: 'dxf',
        category: 'cad',
        isValid: true,
        confidence: 0.9,
        requiresOCR: false,
        canOptimize: false,
      },
      xls: this.MIME_TYPES['application/vnd.ms-excel'],
      xlsx: this.MIME_TYPES['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      txt: this.MIME_TYPES['text/plain'],
    };

    return extensionMap[extension.toLowerCase()];
  }

  /**
   * Analyze PDF to determine if OCR is needed
   */
  private async analyzePDFForOCR(file: File): Promise<boolean> {
    // Simplified check: if PDF is from image scan, it likely needs OCR
    // In production, you'd use a PDF library to check for text layers
    
    // Check file size - very large PDFs might be scanned images
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) {
      // Large PDF might be scanned
      return true;
    }

    // Check filename for scan indicators
    const filename = file.name.toLowerCase();
    const scanIndicators = ['scan', 'scanned', 'image', 'photo'];
    if (scanIndicators.some(indicator => filename.includes(indicator))) {
      return true;
    }

    // Default: assume PDFs have text (can be overridden by actual content analysis)
    return false;
  }

  /**
   * Get allowed file types for document category
   */
  getAllowedFileTypes(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      plans: ['pdf', 'dwg', 'dxf', 'jpg', 'png'],
      calculations: ['pdf', 'xls', 'xlsx'],
      reports: ['pdf', 'txt'],
      photos: ['jpg', 'jpeg', 'png', 'tiff', 'tif'],
      licenses: ['pdf', 'jpg', 'png'],
      other: ['pdf', 'jpg', 'png', 'dwg', 'dxf', 'xls', 'xlsx', 'txt'],
    };

    return categoryMap[category] || categoryMap.other;
  }
}

// Singleton instance
export const fileTypeRecognitionService = new FileTypeRecognitionService();
