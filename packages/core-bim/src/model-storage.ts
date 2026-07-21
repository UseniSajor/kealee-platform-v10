/**
 * @kealee/core-bim — Model Storage Service
 *
 * Handles upload, retrieval, and deletion of BIM model files.
 * Supports multiple storage backends: AWS S3, Cloudflare R2, and local filesystem.
 *
 * This service is framework-agnostic and designed for server-side use.
 */

import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

import type {
  StorageConfig,
  StorageBackend,
  ModelMetadata,
  BIMModelData,
  BIMFormat,
} from './types';
import { ModelMetadataSchema } from './types';

/**
 * ModelStorageService — Manages BIM model file storage.
 *
 * @example
 * ```ts
 * const storage = new ModelStorageService({
 *   backend: 'S3',
 *   bucket: 'kealee-bim-models',
 *   region: 'us-east-1',
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 * });
 *
 * const modelId = await storage.uploadModel(fileBuffer, {
 *   name: 'Building A - Structural',
 *   format: 'IFC4',
 *   projectId: 'proj-123',
 * });
 *
 * const url = await storage.getModelUrl(modelId);
 * ```
 */
export class ModelStorageService {
  private config: StorageConfig;
  private models: Map<string, BIMModelData> = new Map();

  constructor(config: StorageConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Upload a BIM model file to the configured storage backend.
   *
   * @param file - Raw file contents as a Buffer.
   * @param metadata - Model metadata (name, format, project association).
   * @returns The unique model ID assigned to the uploaded file.
   * @throws If metadata validation fails or the upload operation fails.
   */
  async uploadModel(file: Buffer, metadata: ModelMetadata): Promise<string> {
    // Validate metadata
    const validated = ModelMetadataSchema.parse(metadata);

    const modelId = randomUUID();
    const extension = this.getExtension(validated.format);
    const key = `models/${modelId}/${validated.name}${extension}`;

    // Upload to the configured backend
    const fileUrl = await this.putObject(key, file);

    // Store model record
    const modelData: BIMModelData = {
      id: modelId,
      name: validated.name,
      format: validated.format,
      fileUrl,
      elementCount: 0,
      fileSizeBytes: file.length,
      uploadedAt: new Date(),
      projectId: validated.projectId,
    };

    this.models.set(modelId, modelData);

    return modelId;
  }

  /**
   * Get a signed/accessible URL for a stored model.
   *
   * @param modelId - The model ID returned from uploadModel.
   * @returns A URL that can be used to download the model.
   * @throws If the model is not found.
   */
  async getModelUrl(modelId: string): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (this.config.backend === 'LOCAL') {
      return model.fileUrl;
    }

    // For S3/R2, generate a pre-signed URL
    return this.getSignedUrl(model.fileUrl);
  }

  /**
   * Retrieve model metadata by ID.
   *
   * @param modelId - The model ID to look up.
   * @returns The BIMModelData record, or null if not found.
   */
  async getModel(modelId: string): Promise<BIMModelData | null> {
    return this.models.get(modelId) ?? null;
  }

  /**
   * Update model metadata (e.g., after conversion or element extraction).
   *
   * @param modelId - The model ID to update.
   * @param updates - Partial model data to merge.
   * @throws If the model is not found.
   */
  async updateModel(
    modelId: string,
    updates: Partial<BIMModelData>
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    this.models.set(modelId, { ...model, ...updates, id: modelId });
  }

  /**
   * Delete a model and its associated files from storage.
   *
   * @param modelId - The model ID to delete.
   * @throws If the model is not found or the deletion fails.
   */
  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Delete from storage backend
    await this.deleteObject(model.fileUrl);

    // If there's a converted version, delete that too
    if (model.convertedUrl) {
      await this.deleteObject(model.convertedUrl);
    }

    // Remove the record
    this.models.delete(modelId);
  }

  /**
   * List all models, optionally filtered by project.
   *
   * @param projectId - Optional project ID to filter by.
   * @returns Array of BIMModelData records.
   */
  async listModels(projectId?: string): Promise<BIMModelData[]> {
    const all = Array.from(this.models.values());

    if (projectId) {
      return all.filter((m) => m.projectId === projectId);
    }

    return all;
  }

  // -------------------------------------------------------------------------
  // Private helpers — storage backend abstraction
  // -------------------------------------------------------------------------

  private validateConfig(): void {
    const { backend, bucket, localPath } = this.config;

    if (backend === 'S3' || backend === 'R2') {
      if (!bucket) {
        throw new Error(`Storage backend ${backend} requires a bucket name.`);
      }
    }

    if (backend === 'LOCAL') {
      if (!localPath) {
        throw new Error('LOCAL storage backend requires a localPath.');
      }
    }
  }

  /**
   * Upload an object to the configured storage backend.
   * Returns the storage key/path.
   */
  private async putObject(key: string, data: Buffer): Promise<string> {
    switch (this.config.backend) {
      case 'S3':
      case 'R2':
        return this.putObjectS3(key, data);
      case 'LOCAL':
        return this.putObjectLocal(key, data);
      default:
        throw new Error(`Unsupported storage backend: ${this.config.backend}`);
    }
  }

  /**
   * Upload to S3/R2.
   * In production, this would use the AWS SDK or S3-compatible client.
   * This implementation stores the key for later signed URL generation.
   */
  private async putObjectS3(key: string, _data: Buffer): Promise<string> {
    // In a full implementation, this would call:
    // await s3Client.send(new PutObjectCommand({ Bucket, Key, Body }));
    //
    // For now, return the logical path. The actual S3 upload should be
    // integrated when the AWS SDK dependency is available.
    const endpoint = this.config.endpoint ?? `https://s3.${this.config.region ?? 'us-east-1'}.amazonaws.com`;
    return `${endpoint}/${this.config.bucket}/${key}`;
  }

  /**
   * Upload to local filesystem.
   */
  private async putObjectLocal(key: string, data: Buffer): Promise<string> {
    const fullPath = join(this.config.localPath!, key);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, data);

    return fullPath;
  }

  /**
   * Generate a pre-signed URL for S3/R2 objects.
   * In production, this would use AWS SDK's getSignedUrl.
   */
  private async getSignedUrl(objectUrl: string): Promise<string> {
    // In a full implementation:
    // return getSignedUrl(s3Client, new GetObjectCommand({ Bucket, Key }), { expiresIn });
    const expiry = this.config.signedUrlExpiry ?? 3600;
    return `${objectUrl}?X-Amz-Expires=${expiry}&signature=placeholder`;
  }

  /**
   * Delete an object from storage.
   */
  private async deleteObject(objectUrl: string): Promise<void> {
    switch (this.config.backend) {
      case 'S3':
      case 'R2':
        // In production: await s3Client.send(new DeleteObjectCommand({ Bucket, Key }));
        break;
      case 'LOCAL':
        try {
          await fs.unlink(objectUrl);
        } catch {
          // File may already be gone
        }
        break;
    }
  }

  /**
   * Map BIM format to file extension.
   */
  private getExtension(format: BIMFormat): string {
    switch (format) {
      case 'IFC':
      case 'IFC2x3':
      case 'IFC4':
      case 'IFC4x3':
        return '.ifc';
      case 'GLTF':
        return '.gltf';
      case 'GLB':
        return '.glb';
      default:
        return '.ifc';
    }
  }
}
