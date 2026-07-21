/**
 * portal-owner/lib/api/files.ts
 * File upload/download wrappers using the /files API endpoints.
 */

import { getAuthToken } from '../supabase'
import { apiFetch } from './client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface UploadedFile {
  id: string
  fileName: string
  mimeType: string
  size: number
  url?: string
  folder?: string
  metadata?: Record<string, string>
  createdAt: string
}

export async function listFiles(
  folder?: string,
  limit = 100,
): Promise<{ files: UploadedFile[]; total: number }> {
  const qs = new URLSearchParams({ limit: String(limit) })
  if (folder) qs.set('folder', folder)
  return apiFetch<{ files: UploadedFile[]; total: number }>(`/files?${qs}`)
}

/** Upload a file using multipart/form-data (avoids Content-Type: application/json issue) */
export async function uploadFile(
  file: File,
  folder = 'project-documents',
  metadata?: Record<string, string>,
): Promise<UploadedFile> {
  const token = await getAuthToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  if (metadata) formData.append('metadata', JSON.stringify(metadata))

  const res = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    let body: any
    try { body = await res.json() } catch { /* ignore */ }
    throw new Error(body?.error ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<UploadedFile>
}

export async function getDownloadUrl(
  fileId: string,
): Promise<{ url: string; expiresAt: string }> {
  return apiFetch<{ url: string; expiresAt: string }>(`/files/${fileId}/download`)
}

export async function deleteFile(fileId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/files/${fileId}`, { method: 'DELETE' })
}
