'use client'

import { useCallback, useState, useRef, DragEvent, ChangeEvent } from 'react'
import { api } from '@/lib/api'

type EvidenceFile = {
  id: string
  file: File
  url?: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
  evidenceType?: string
  caption: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

type MilestoneSubmissionFormProps = {
  milestoneId: string
  projectId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function MilestoneSubmissionForm({
  milestoneId,
  projectId,
  onSuccess,
  onCancel,
}: MilestoneSubmissionFormProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Prompt 3.2: Bulk file upload with drag-and-drop
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      await handleFiles(droppedFiles)
    },
    []
  )

  // Prompt 3.2: File type validation
  const validateFile = useCallback((file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const maxSize = 50 * 1024 * 1024 // 50MB

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" exceeds maximum size of ${maxSize / (1024 * 1024)}MB`)
    }

    // Check file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File type "${file.type}" is not allowed. Allowed types: images (JPEG, PNG, WebP), documents (PDF, DOC, DOCX), videos (MP4, WebM, MOV)`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }, [])

  const handleFiles = useCallback(
    async (fileList: File[]) => {
      setError(null)

      // Validate all files
      const validationResults = fileList.map((file) => ({
        file,
        validation: validateFile(file),
      }))

      const invalidFiles = validationResults.filter((r) => !r.validation.valid)
      if (invalidFiles.length > 0) {
        setError(
          `Invalid files:\n${invalidFiles.map((f) => `- ${f.file.name}: ${f.validation.errors.join(', ')}`).join('\n')}`
        )
        return
      }

      // Add files to state
      const newFiles: EvidenceFile[] = fileList.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        caption: '',
        uploading: false,
        uploaded: false,
      }))

      setFiles((prev) => [...prev, ...newFiles])
    },
    [validateFile]
  )

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files ? Array.from(e.target.files) : []
      handleFiles(fileList)
    },
    [handleFiles]
  )

  // Prompt 3.2: Upload file
  const uploadFile = useCallback(
    async (evidenceFile: EvidenceFile) => {
      const formData = new FormData()
      formData.append('file', evidenceFile.file)

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/milestones/${milestoneId}/upload`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload file')
        }

        const result = await response.json()

        return {
          ...evidenceFile,
          url: result.evidence.url,
          fileName: result.evidence.fileName,
          mimeType: result.evidence.mimeType,
          sizeBytes: result.evidence.sizeBytes,
          evidenceType: result.evidenceType,
          uploaded: true,
          uploading: false,
        }
      } catch (err) {
        return {
          ...evidenceFile,
          error: err instanceof Error ? err.message : 'Upload failed',
          uploading: false,
        }
      }
    },
    [milestoneId]
  )

  const handleUploadAll = useCallback(async () => {
    setError(null)

    // Mark all files as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, uploading: true, error: undefined })))

    // Upload all files
    const uploadPromises = files.map((f) => uploadFile(f))
    const results = await Promise.all(uploadPromises)

    // Update files with upload results
    setFiles(results)

    // Check for errors
    const failedUploads = results.filter((f) => f.error)
    if (failedUploads.length > 0) {
      setError(`Failed to upload ${failedUploads.length} file(s). Please try again.`)
    }
  }, [files, uploadFile])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleCaptionChange = useCallback((id: string, caption: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, caption } : f)))
  }, [])

  // Prompt 3.2: Submit milestone
  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      setError('Please upload at least one file')
      return
    }

    const unuploadedFiles = files.filter((f) => !f.uploaded && !f.uploading)
    if (unuploadedFiles.length > 0) {
      setError('Please wait for all files to finish uploading')
      return
    }

    const failedUploads = files.filter((f) => f.error)
    if (failedUploads.length > 0) {
      setError('Please fix upload errors before submitting')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Convert uploaded files to evidence format
      const evidence = files
        .filter((f) => f.uploaded && f.url)
        .map((f) => ({
          type: f.evidenceType || 'OTHER',
          fileUrl: f.url!,
          url: f.url!,
          caption: f.caption || undefined,
        }))

      await api.submitMilestone(milestoneId, evidence)
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit milestone')
      setSubmitting(false)
    }
  }, [files, milestoneId, onSuccess])

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      ) : null}

      {/* Prompt 3.2: Bulk file upload with drag-and-drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          accept="image/*,.pdf,.doc,.docx,video/*"
          className="hidden"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            Drag and drop files here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 underline underline-offset-4 hover:text-blue-700"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-neutral-600">
            Allowed: Images (JPEG, PNG, WebP), Documents (PDF, DOC, DOCX), Videos (MP4, WebM, MOV)
          </p>
          <p className="text-xs text-neutral-500">Maximum file size: 50MB</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-900">
              Uploaded Files ({files.filter((f) => f.uploaded).length}/{files.length})
            </h3>
            {files.some((f) => !f.uploaded && !f.uploading) ? (
              <button
                type="button"
                onClick={handleUploadAll}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Upload All
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {files.map((evidenceFile) => (
              <div
                key={evidenceFile.id}
                className={`rounded-lg border p-4 ${
                  evidenceFile.error
                    ? 'border-red-200 bg-red-50'
                    : evidenceFile.uploaded
                      ? 'border-green-200 bg-green-50'
                      : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{evidenceFile.file.name}</span>
                      {evidenceFile.uploading ? (
                        <span className="text-xs text-blue-600">Uploading...</span>
                      ) : evidenceFile.uploaded ? (
                        <span className="text-xs text-green-600">✓ Uploaded</span>
                      ) : evidenceFile.error ? (
                        <span className="text-xs text-red-600">✗ {evidenceFile.error}</span>
                      ) : (
                        <span className="text-xs text-amber-600">Pending upload</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-neutral-600">
                      {(evidenceFile.file.size / 1024).toFixed(2)} KB • {evidenceFile.file.type}
                    </p>
                    {evidenceFile.evidenceType ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        Type: <strong>{evidenceFile.evidenceType}</strong>
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-neutral-700">Caption (optional)</label>
                      <input
                        type="text"
                        value={evidenceFile.caption}
                        onChange={(e) => handleCaptionChange(evidenceFile.id, e.target.value)}
                        placeholder="Add a caption for this file..."
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                        disabled={evidenceFile.uploading}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(evidenceFile.id)}
                    disabled={evidenceFile.uploading}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || files.length === 0 || files.some((f) => !f.uploaded || f.uploading)}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Milestone'}
        </button>
      </div>
    </div>
  )
}
