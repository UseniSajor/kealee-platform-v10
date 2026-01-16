/**
 * Document Versioning Service
 * Version control for resubmitted documents
 */

import {createClient} from '@/lib/supabase/client';

export interface DocumentVersion {
  id: string;
  documentId: string;
  permitId: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  reason?: string; // 'initial', 'correction', 'resubmission'
  changes?: string; // Description of changes
  previousVersionId?: string;
  isCurrent: boolean;
  metadata?: {
    pageCount?: number;
    extractedText?: string;
    ocrPerformed?: boolean;
  };
}

export interface VersionComparison {
  added: string[];
  removed: string[];
  modified: string[];
  similarity: number; // 0-1
}

export class DocumentVersioningService {
  /**
   * Create new document version
   */
  async createVersion(
    permitId: string,
    documentId: string,
    file: File | Blob,
    options?: {
      reason?: string;
      changes?: string;
      uploadedBy: string;
    }
  ): Promise<DocumentVersion> {
    const supabase = createClient();

    // Get current version
    const currentVersion = await this.getCurrentVersion(documentId);
    const nextVersion = currentVersion ? currentVersion.version + 1 : 1;

    // Upload file
    const fileUrl = await this.uploadFile(permitId, documentId, nextVersion, file);

    // Create version record
    const version: DocumentVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      documentId,
      permitId,
      version: nextVersion,
      fileUrl,
      fileSize: file.size,
      uploadedBy: options?.uploadedBy || 'unknown',
      uploadedAt: new Date(),
      reason: options?.reason || (nextVersion === 1 ? 'initial' : 'resubmission'),
      changes: options?.changes,
      previousVersionId: currentVersion?.id,
      isCurrent: true,
    };

    // Mark previous version as not current
    if (currentVersion) {
      await supabase
        .from('DocumentVersion')
        .update({isCurrent: false})
        .eq('id', currentVersion.id);
    }

    // Store version in database
    await supabase.from('DocumentVersion').insert({
      id: version.id,
      documentId: version.documentId,
      permitId: version.permitId,
      version: version.version,
      fileUrl: version.fileUrl,
      fileSize: version.fileSize,
      uploadedBy: version.uploadedBy,
      uploadedAt: version.uploadedAt.toISOString(),
      reason: version.reason,
      changes: version.changes,
      previousVersionId: version.previousVersionId,
      isCurrent: version.isCurrent,
      metadata: version.metadata || {},
    });

    return version;
  }

  /**
   * Get all versions for a document
   */
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const supabase = createClient();

    const {data, error} = await supabase
      .from('DocumentVersion')
      .select('*')
      .eq('documentId', documentId)
      .order('version', {ascending: false});

    if (error || !data) {
      return [];
    }

    return data.map(this.mapVersion);
  }

  /**
   * Get current version
   */
  async getCurrentVersion(documentId: string): Promise<DocumentVersion | null> {
    const supabase = createClient();

    const {data} = await supabase
      .from('DocumentVersion')
      .select('*')
      .eq('documentId', documentId)
      .eq('isCurrent', true)
      .single();

    return data ? this.mapVersion(data) : null;
  }

  /**
   * Get specific version
   */
  async getVersion(documentId: string, version: number): Promise<DocumentVersion | null> {
    const supabase = createClient();

    const {data} = await supabase
      .from('DocumentVersion')
      .select('*')
      .eq('documentId', documentId)
      .eq('version', version)
      .single();

    return data ? this.mapVersion(data) : null;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    documentId: string,
    version1: number,
    version2: number
  ): Promise<VersionComparison> {
    const v1 = await this.getVersion(documentId, version1);
    const v2 = await this.getVersion(documentId, version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    // Extract text from both versions
    const text1 = v1.metadata?.extractedText || '';
    const text2 = v2.metadata?.extractedText || '';

    // Simple text comparison (in production, use more sophisticated diff)
    const similarity = this.calculateSimilarity(text1, text2);

    // Extract changes (simplified)
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Split into sentences/paragraphs for comparison
    const lines1 = text1.split('\n').filter(l => l.trim());
    const lines2 = text2.split('\n').filter(l => l.trim());

    // Find added lines
    for (const line of lines2) {
      if (!lines1.includes(line)) {
        added.push(line);
      }
    }

    // Find removed lines
    for (const line of lines1) {
      if (!lines2.includes(line)) {
        removed.push(line);
      }
    }

    // Modified lines (similar but not identical)
    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      if (lines1[i] !== lines2[i] && this.calculateSimilarity(lines1[i], lines2[i]) > 0.5) {
        modified.push(lines2[i]);
      }
    }

    return {
      added,
      removed,
      modified,
      similarity,
    };
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 && !text2) return 1;
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(
    permitId: string,
    documentId: string,
    version: number,
    file: File | Blob
  ): Promise<string> {
    const supabase = createClient();

    const fileName = file instanceof File ? file.name : `document-v${version}`;
    const fileExt = fileName.split('.').pop() || 'pdf';
    const filePath = `permits/${permitId}/documents/${documentId}/v${version}.${fileExt}`;

    const {data, error} = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const {data: urlData} = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  /**
   * Map database record to DocumentVersion
   */
  private mapVersion(record: any): DocumentVersion {
    return {
      id: record.id,
      documentId: record.documentId,
      permitId: record.permitId,
      version: record.version,
      fileUrl: record.fileUrl,
      fileSize: record.fileSize,
      uploadedBy: record.uploadedBy,
      uploadedAt: new Date(record.uploadedAt),
      reason: record.reason,
      changes: record.changes,
      previousVersionId: record.previousVersionId,
      isCurrent: record.isCurrent,
      metadata: record.metadata || {},
    };
  }

  /**
   * Get version history for permit
   */
  async getPermitVersionHistory(permitId: string): Promise<DocumentVersion[]> {
    const supabase = createClient();

    const {data} = await supabase
      .from('DocumentVersion')
      .select('*')
      .eq('permitId', permitId)
      .order('uploadedAt', {ascending: false});

    return (data || []).map(this.mapVersion);
  }
}

// Singleton instance
export const documentVersioningService = new DocumentVersioningService();
