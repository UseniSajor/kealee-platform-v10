/**
 * verification-document.storage.ts
 *
 * Thin S3/R2 storage abstraction for VerificationDocument.
 * Wraps the same AWS SDK used by file.service.ts so configuration
 * is inherited from the same env vars (S3_* / R2_*).
 *
 * Key format:
 *   verification-docs/{marketplaceProfileId}/{documentType}/{uuid}/{sanitized-filename}
 *
 * All objects are PRIVATE — access is exclusively via presigned URLs.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME          = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'kealee-uploads'
const UPLOAD_URL_EXPIRY    = 3_600   // 1 h — time to complete upload
const DOWNLOAD_URL_EXPIRY  = 3_600   // 1 h — time to use download link

// ─── Client factory (mirrors file.service.ts) ────────────────────────────────

function getS3Client(): S3Client | null {
  const endpoint        = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const region          = process.env.S3_REGION || process.env.R2_REGION || 'us-east-1'
  const accessKeyId     = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.warn('[VerificationStorage] S3/R2 credentials not configured')
    return null
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: endpoint ? true : false,
  })
}

function requireS3(): S3Client {
  const client = getS3Client()
  if (!client) {
    throw new Error(
      'File storage (S3/R2) is not configured. ' +
      'Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables.'
    )
  }
  return client
}

// ─── Key builder ─────────────────────────────────────────────────────────────

export function buildVerificationDocKey(
  marketplaceProfileId: string,
  documentType: string,
  fileName: string,
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `verification-docs/${marketplaceProfileId}/${documentType}/${uuidv4()}/${sanitized}`
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PresignedUploadResult {
  presignedUrl: string
  key:          string
  expiresAt:    string  // ISO
}

export interface PresignedDownloadResult {
  url:       string
  expiresAt: string  // ISO
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Generate a presigned PUT URL the client uploads to directly.
 * No DB record is created here — that happens after the upload via the
 * POST /verification/documents endpoint.
 */
export async function getPresignedUploadUrl(
  marketplaceProfileId: string,
  documentType: string,
  fileName: string,
  mimeType: string,
): Promise<PresignedUploadResult> {
  const s3  = requireS3()
  const key = buildVerificationDocKey(marketplaceProfileId, documentType, fileName)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key:    key,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
    Metadata: {
      purpose:              'verification',
      marketplaceProfileId,
      documentType,
      uploadedAt:           new Date().toISOString(),
    },
  })

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_EXPIRY })
  return {
    presignedUrl,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_EXPIRY * 1_000).toISOString(),
  }
}

/**
 * Generate a presigned GET URL for downloading a verification document.
 * URL is valid for 1 hour — never store or cache this value.
 */
export async function getPresignedDownloadUrl(
  key: string,
  originalFileName?: string,
): Promise<PresignedDownloadResult> {
  const s3 = requireS3()

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key:    key,
    ...(originalFileName
      ? { ResponseContentDisposition: `attachment; filename="${originalFileName}"` }
      : {}),
  })

  const url = await getSignedUrl(s3, command, { expiresIn: DOWNLOAD_URL_EXPIRY })
  return {
    url,
    expiresAt: new Date(Date.now() + DOWNLOAD_URL_EXPIRY * 1_000).toISOString(),
  }
}

/**
 * Delete a verification document object from S3/R2.
 * Called only when a document record is hard-deleted (not normally done;
 * prefer ARCHIVED status, but available for admin tooling).
 */
export async function deleteVerificationDocObject(key: string): Promise<void> {
  const s3 = requireS3()
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
}
