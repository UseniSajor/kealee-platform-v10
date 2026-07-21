/**
 * Document Service — unified document management
 */

export interface DocumentMetadata {
  id: string;
  name: string;
  description?: string;
  category: string; // "contract", "permit", "report", "drawing", "photo"
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  projectId?: string;
  orgId?: string;
  uploadedBy: string;
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRequest {
  name: string;
  category: string;
  mimeType: string;
  fileSize: number;
  projectId?: string;
  orgId?: string;
  uploadedBy: string;
  tags?: string[];
  description?: string;
}

export interface DocumentQuery {
  projectId?: string;
  orgId?: string;
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export class DocumentService {
  private storageAdapter: {
    getUploadUrl(key: string, mimeType: string): Promise<{ url: string; key: string }>;
    getDownloadUrl(key: string): Promise<string>;
    deleteFile(key: string): Promise<void>;
  } | null = null;

  /**
   * Set the storage adapter (S3, R2, etc.)
   */
  setStorageAdapter(adapter: typeof this.storageAdapter): void {
    this.storageAdapter = adapter;
  }

  /**
   * Generate a pre-signed upload URL
   */
  async getUploadUrl(request: UploadRequest): Promise<{ uploadUrl: string; documentId: string; key: string }> {
    if (!this.storageAdapter) throw new Error('Storage adapter not configured');

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `documents/${request.orgId ?? 'global'}/${request.projectId ?? 'general'}/${documentId}/${request.name}`;

    const { url } = await this.storageAdapter.getUploadUrl(key, request.mimeType);

    return { uploadUrl: url, documentId, key };
  }

  /**
   * Get a download URL for a document
   */
  async getDownloadUrl(key: string): Promise<string> {
    if (!this.storageAdapter) throw new Error('Storage adapter not configured');
    return this.storageAdapter.getDownloadUrl(key);
  }

  /**
   * Delete a document
   */
  async deleteDocument(key: string): Promise<void> {
    if (!this.storageAdapter) throw new Error('Storage adapter not configured');
    await this.storageAdapter.deleteFile(key);
  }
}
