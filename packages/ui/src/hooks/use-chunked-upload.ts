'use client';

/**
 * useChunkedUpload — High-performance file upload hook
 *
 * Features:
 *  - Client-side image compression (resize to max 2000px, 80% JPEG quality)
 *  - Chunked uploads for large files (>5MB split into 1MB chunks)
 *  - 3 concurrent chunk uploads
 *  - Per-chunk retry on failure (3 attempts)
 *  - Real progress tracking
 *  - Background upload support (user can keep working)
 *  - Abort/cancel capability
 *
 * Usage:
 *   const { upload, progress, status, cancel } = useChunkedUpload({
 *     endpoint: '/api/v1/uploads',
 *     onComplete: (result) => console.log('Uploaded:', result),
 *   });
 *
 *   // In handler:
 *   upload(file);
 */

import { useState, useRef, useCallback } from 'react';

// ── Types ──
export interface UploadOptions {
  /** API endpoint for uploads */
  endpoint: string;
  /** Chunked upload endpoint (for reassembly) */
  chunkedEndpoint?: string;
  /** Additional form data fields */
  metadata?: Record<string, string>;
  /** Auth headers */
  headers?: Record<string, string>;
  /** Max image dimension (default 2000px) */
  maxImageDimension?: number;
  /** JPEG compression quality 0-1 (default 0.8) */
  compressionQuality?: number;
  /** Chunk size in bytes (default 1MB) */
  chunkSize?: number;
  /** Size threshold for chunked upload (default 5MB) */
  chunkThreshold?: number;
  /** Max concurrent chunk uploads (default 3) */
  concurrency?: number;
  /** Max retry attempts per chunk (default 3) */
  maxRetries?: number;
  /** Callback when upload completes */
  onComplete?: (result: UploadResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback for progress updates */
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  fileId?: string;
  originalName: string;
  size: number;
  compressedSize?: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'complete' | 'error' | 'cancelled';

export interface UseChunkedUploadReturn {
  /** Upload a single file */
  upload: (file: File) => Promise<UploadResult | null>;
  /** Upload multiple files */
  uploadMultiple: (files: File[]) => Promise<(UploadResult | null)[]>;
  /** Current upload progress (0-100) */
  progress: number;
  /** Current status */
  status: UploadStatus;
  /** Error message if failed */
  error: string | null;
  /** Cancel current upload */
  cancel: () => void;
  /** Reset state */
  reset: () => void;
}

// ── Constants ──
const DEFAULT_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB
const DEFAULT_CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5MB
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_IMAGE_DIM = 2000;
const DEFAULT_QUALITY = 0.8;

// ── Image Compression ──
async function compressImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than max dimension
      if (width <= maxDimension && height <= maxDimension) {
        // Still compress quality if JPEG
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                resolve(file); // Original is smaller
              }
            },
            'image/jpeg',
            quality
          );
          return;
        }
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

// ── Chunk Upload with Retry ──
async function uploadChunk(
  url: string,
  chunk: Blob,
  index: number,
  totalChunks: number,
  uploadId: string,
  fileName: string,
  headers: Record<string, string>,
  maxRetries: number,
  signal: AbortSignal
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', String(index));
      formData.append('totalChunks', String(totalChunks));
      formData.append('uploadId', uploadId);
      formData.append('fileName', fileName);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal,
        credentials: 'include',
      });

      if (response.ok) return true;
      if (response.status >= 400 && response.status < 500) throw new Error(`Upload rejected: ${response.status}`);
      // Server error — retry
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (attempt === maxRetries - 1) throw err;
      // Wait before retry (exponential backoff)
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
  return false;
}

// ── Hook ──
export function useChunkedUpload(options: UploadOptions): UseChunkedUploadReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    endpoint,
    chunkedEndpoint,
    metadata = {},
    headers = {},
    maxImageDimension = DEFAULT_MAX_IMAGE_DIM,
    compressionQuality = DEFAULT_QUALITY,
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkThreshold = DEFAULT_CHUNK_THRESHOLD,
    concurrency = DEFAULT_CONCURRENCY,
    maxRetries = DEFAULT_MAX_RETRIES,
    onComplete,
    onError,
    onProgress,
  } = options;

  const updateProgress = useCallback((p: number) => {
    setProgress(p);
    onProgress?.(p);
  }, [onProgress]);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setError(null);
    setStatus('compressing');
    updateProgress(0);

    try {
      // Step 1: Compress image if applicable
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file, maxImageDimension, compressionQuality);
        updateProgress(10);
      }

      if (signal.aborted) { setStatus('cancelled'); return null; }

      // Step 2: Choose upload strategy
      setStatus('uploading');

      if (processedFile.size > chunkThreshold) {
        // ── Chunked upload ──
        const totalChunks = Math.ceil(processedFile.size / chunkSize);
        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const chunkUrl = chunkedEndpoint || `${endpoint}/chunk`;

        let completedChunks = 0;

        // Process chunks in batches of `concurrency`
        const chunkPromises: Promise<boolean>[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, processedFile.size);
          const chunk = processedFile.slice(start, end);

          const promise = uploadChunk(
            chunkUrl, chunk, i, totalChunks, uploadId, file.name,
            headers, maxRetries, signal
          ).then((success) => {
            if (success) {
              completedChunks++;
              updateProgress(10 + Math.round((completedChunks / totalChunks) * 85));
            }
            return success;
          });

          chunkPromises.push(promise);

          // Throttle concurrency
          if (chunkPromises.length >= concurrency) {
            await Promise.race(chunkPromises);
          }
        }

        await Promise.all(chunkPromises);

        // Step 3: Finalize chunked upload
        const finalizeResponse = await fetch(`${endpoint}/finalize`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            fileName: file.name,
            totalChunks,
            mimeType: processedFile.type,
            ...metadata,
          }),
          signal,
          credentials: 'include',
        });

        if (!finalizeResponse.ok) throw new Error('Failed to finalize upload');

        const result = await finalizeResponse.json();
        updateProgress(100);
        setStatus('complete');

        const uploadResult: UploadResult = {
          url: result.url || result.fileUrl,
          fileId: result.id || result.fileId,
          originalName: file.name,
          size: file.size,
          compressedSize: processedFile.size,
          mimeType: processedFile.type,
          thumbnailUrl: result.thumbnailUrl,
        };

        onComplete?.(uploadResult);
        return uploadResult;

      } else {
        // ── Simple upload (small file) ──
        const formData = new FormData();
        formData.append('file', processedFile, file.name);
        Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));

        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              updateProgress(10 + Math.round((e.loaded / e.total) * 85));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const result = JSON.parse(xhr.responseText);
              resolve({
                url: result.url || result.fileUrl,
                fileId: result.id || result.fileId,
                originalName: file.name,
                size: file.size,
                compressedSize: processedFile.size,
                mimeType: processedFile.type,
                thumbnailUrl: result.thumbnailUrl,
              });
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.onabort = () => reject(new Error('Upload cancelled'));

          xhr.open('POST', endpoint);
          Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          xhr.withCredentials = true;
          xhr.send(formData);
        });

        // Handle abort
        signal.addEventListener('abort', () => xhr.abort());

        const result = await uploadPromise;
        updateProgress(100);
        setStatus('complete');
        onComplete?.(result);
        return result;
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Upload cancelled') {
        setStatus('cancelled');
        return null;
      }
      setError(err.message);
      setStatus('error');
      onError?.(err);
      return null;
    }
  }, [endpoint, chunkedEndpoint, metadata, headers, maxImageDimension, compressionQuality, chunkSize, chunkThreshold, concurrency, maxRetries, onComplete, onError, updateProgress]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<(UploadResult | null)[]> => {
    const results: (UploadResult | null)[] = [];
    for (const file of files) {
      const result = await upload(file);
      results.push(result);
    }
    return results;
  }, [upload]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('cancelled');
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  return { upload, uploadMultiple, progress, status, error, cancel, reset };
}

export default useChunkedUpload;
