/**
 * Document Storage Service
 * Secure document storage with access controls
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface DocumentAccessControl {
  permitId: string;
  documentId: string;
  userId: string;
  role: 'applicant' | 'reviewer' | 'admin' | 'public';
  permissions: Array<'read' | 'write' | 'delete' | 'download'>;
  expiresAt?: Date;
}

export interface StoredDocument {
  id: string;
  permitId: string;
  documentType: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  encrypted: boolean;
  accessControls: DocumentAccessControl[];
  version: number;
}

export class DocumentStorageService {
  /**
   * Store document with access controls
   */
  async storeDocument(
    permitId: string,
    file: File | Blob,
    metadata: {
      documentType: string;
      name: string;
      uploadedBy: string;
      encrypted?: boolean;
      accessControls?: Array<{
        userId: string;
        role: 'applicant' | 'reviewer' | 'admin' | 'public';
        permissions: Array<'read' | 'write' | 'delete' | 'download'>;
      }>;
    }
  ): Promise<StoredDocument> {
    const supabase = createClient();

    // Generate document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Encrypt if requested
    let fileToStore = file;
    if (metadata.encrypted) {
      fileToStore = await this.encryptFile(file);
    }

    // Upload to storage
    const fileName = file instanceof File ? file.name : metadata.name;
    const fileExt = fileName.split('.').pop() || 'pdf';
    const filePath = `permits/${permitId}/documents/${documentId}.${fileExt}`;

    const {error: uploadError} = await supabase.storage
      .from('documents')
      .upload(filePath, fileToStore, {
        upsert: false,
        contentType: file instanceof File ? file.type : 'application/octet-stream',
      });

    if (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    // Get public/signed URL
    const {data: urlData} = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create access controls
    const defaultAccessControls = this.getDefaultAccessControls(
      permitId,
      documentId,
      metadata.uploadedBy
    );

    const accessControls = metadata.accessControls || defaultAccessControls;

    // Store access controls
    for (const access of accessControls) {
      await supabase.from('DocumentAccessControl').insert({
        permitId: access.permitId,
        documentId: access.documentId,
        userId: access.userId,
        role: access.role,
        permissions: access.permissions,
        expiresAt: access.expiresAt?.toISOString(),
      });
    }

    // Create document record
    const document: StoredDocument = {
      id: documentId,
      permitId,
      documentType: metadata.documentType,
      name: metadata.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      mimeType: file instanceof File ? file.type : 'application/octet-stream',
      uploadedBy: metadata.uploadedBy,
      uploadedAt: new Date(),
      encrypted: metadata.encrypted || false,
      accessControls,
      version: 1,
    };

    // Store in database
    await supabase.from('PermitDocument').insert({
      id: documentId,
      permitId,
      type: metadata.documentType,
      name: metadata.name,
      fileUrl: urlData.publicUrl,
      fileSize: file.size,
      mimeType: document.mimeType,
      uploadedBy: metadata.uploadedBy,
      uploadedAt: document.uploadedAt.toISOString(),
    });

    return document;
  }

  /**
   * Get document with access check
   */
  async getDocument(
    documentId: string,
    userId: string
  ): Promise<StoredDocument | null> {
    const supabase = createClient();

    // Check access
    const hasAccess = await this.checkAccess(documentId, userId, 'read');
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get document
    const {data: doc} = await supabase
      .from('PermitDocument')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!doc) {
      return null;
    }

    // Get access controls
    const {data: accessControls} = await supabase
      .from('DocumentAccessControl')
      .select('*')
      .eq('documentId', documentId);

    return {
      id: doc.id,
      permitId: doc.permitId,
      documentType: doc.type,
      name: doc.name,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedBy: doc.uploadedBy,
      uploadedAt: new Date(doc.uploadedAt),
      encrypted: false, // Would check from metadata
      accessControls: (accessControls || []).map(this.mapAccessControl),
      version: 1, // Would get from versioning service
    };
  }

  /**
   * Check if user has access to document
   */
  async checkAccess(
    documentId: string,
    userId: string,
    permission: 'read' | 'write' | 'delete' | 'download'
  ): Promise<boolean> {
    const supabase = createClient();

    // Get access control
    const {data: access} = await supabase
      .from('DocumentAccessControl')
      .select('*')
      .eq('documentId', documentId)
      .eq('userId', userId)
      .single();

    if (!access) {
      // Check if user has role-based access
      return this.checkRoleBasedAccess(documentId, userId, permission);
    }

    // Check if expired
    if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
      return false;
    }

    // Check permission
    return access.permissions.includes(permission);
  }

  /**
   * Check role-based access
   */
  private async checkRoleBasedAccess(
    documentId: string,
    userId: string,
    permission: 'read' | 'write' | 'delete' | 'download'
  ): Promise<boolean> {
    const supabase = createClient();

    // Get document
    const {data: doc} = await supabase
      .from('PermitDocument')
      .select('permitId, permit:permitId(applicantId)')
      .eq('id', documentId)
      .single();

    if (!doc) {
      return false;
    }

    // Check if user is applicant
    if ((doc.permit as any)?.applicantId === userId) {
      return ['read', 'download'].includes(permission);
    }

    // Check if user is staff/reviewer
    const {data: staff} = await supabase
      .from('JurisdictionStaff')
      .select('role')
      .eq('userId', userId)
      .eq('active', true)
      .single();

    if (staff) {
      // Reviewers can read/download
      if (['read', 'download'].includes(permission)) {
        return true;
      }
      // Admins can do everything
      if (staff.role === 'ADMINISTRATOR') {
        return true;
      }
    }

    return false;
  }

  /**
   * Get default access controls
   */
  private getDefaultAccessControls(
    permitId: string,
    documentId: string,
    uploadedBy: string
  ): DocumentAccessControl[] {
    return [
      {
        permitId,
        documentId,
        userId: uploadedBy,
        role: 'applicant',
        permissions: ['read', 'download'],
      },
      // Public read access for permit documents (jurisdiction requirement)
      {
        permitId,
        documentId,
        userId: 'public',
        role: 'public',
        permissions: ['read'],
      },
    ];
  }

  /**
   * Encrypt file
   */
  private async encryptFile(file: File | Blob): Promise<Blob> {
    // In production, use Web Crypto API or server-side encryption
    // For now, return original file
    return file instanceof Blob ? file : new Blob([file]);
  }

  /**
   * Decrypt file
   */
  async decryptFile(encryptedBlob: Blob): Promise<Blob> {
    // In production, decrypt using Web Crypto API
    return encryptedBlob;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const supabase = createClient();

    // Check delete permission
    const hasAccess = await this.checkAccess(documentId, userId, 'delete');
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get document
    const {data: doc} = await supabase
      .from('PermitDocument')
      .select('fileUrl')
      .eq('id', documentId)
      .single();

    if (doc) {
      // Extract file path from URL
      const filePath = doc.fileUrl.split('/').slice(-3).join('/');

      // Delete from storage
      await supabase.storage.from('documents').remove([filePath]);
    }

    // Delete access controls
    await supabase
      .from('DocumentAccessControl')
      .delete()
      .eq('documentId', documentId);

    // Delete document record
    await supabase.from('PermitDocument').delete().eq('id', documentId);
  }

  /**
   * Map access control record
   */
  private mapAccessControl(record: any): DocumentAccessControl {
    return {
      permitId: record.permitId,
      documentId: record.documentId,
      userId: record.userId,
      role: record.role,
      permissions: record.permissions,
      expiresAt: record.expiresAt ? new Date(record.expiresAt) : undefined,
    };
  }
}

// Singleton instance
export const documentStorageService = new DocumentStorageService();
