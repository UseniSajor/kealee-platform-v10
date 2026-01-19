/**
 * S3/R2 File Upload Utilities
 * Handles presigned URLs and file uploads
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export type UploadFile = {
  file: File
  fileName?: string
  mimeType?: string
  metadata?: Record<string, string>
}

export type PresignedUrlResponse = {
  url: string
  key: string
  expiresAt: string
}

export type UploadResponse = {
  url: string
  key: string
  fileName: string
  size: number
  mimeType: string
}

/**
 * Get presigned URL for file upload
 */
export async function getPresignedUrl(
  fileName: string,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<PresignedUrlResponse> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}/files/presigned-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileName,
      mimeType,
      metadata,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get presigned URL')
  }

  return response.json()
}

/**
 * Upload file to S3/R2 using presigned URL
 */
export async function uploadFile(file: File, presignedUrl: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to upload file')
  }
}

/**
 * Upload file with automatic presigned URL generation
 */
export async function uploadFileToS3(
  file: File,
  metadata?: Record<string, string>
): Promise<UploadResponse> {
  // Get presigned URL
  const { url, key } = await getPresignedUrl(file.name, file.type, metadata)

  // Upload file
  await uploadFile(file, url)

  return {
    url: key, // Use key as URL (will be resolved by backend)
    key,
    fileName: file.name,
    size: file.size,
    mimeType: file.type,
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: UploadFile[]
): Promise<UploadResponse[]> {
  return Promise.all(
    files.map(({ file, metadata }) => uploadFileToS3(file, metadata))
  )
}

async function getAuthToken(): Promise<string | null> {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find((c) => c.trim().startsWith('sb-access-token='))
  return tokenCookie ? tokenCookie.split('=')[1] : null
}
