'use client';

/**
 * UploadProgress — Visual file upload progress with compression indicator
 *
 * Shows:
 *  - File name and original/compressed size
 *  - Progress bar with percentage
 *  - Status indicators (compressing, uploading, complete, error)
 *  - Cancel button during upload
 *  - Green checkmark on completion
 *
 * Usage:
 *   <UploadProgress
 *     fileName="photo-001.jpg"
 *     progress={65}
 *     status="uploading"
 *     originalSize={5_200_000}
 *     compressedSize={800_000}
 *     onCancel={() => cancel()}
 *   />
 */

import React from 'react';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'idle' | 'compressing' | 'uploading' | 'complete' | 'error' | 'cancelled';
  originalSize?: number;
  compressedSize?: number;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function UploadProgress({
  fileName,
  progress,
  status,
  originalSize,
  compressedSize,
  error,
  onCancel,
  onRetry,
  className = '',
}: UploadProgressProps) {
  const compressionRatio = originalSize && compressedSize
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : null;

  const statusConfig = {
    idle: { color: 'bg-gray-200', label: 'Waiting...', textColor: 'text-gray-500' },
    compressing: { color: 'bg-amber-500', label: 'Compressing...', textColor: 'text-amber-600' },
    uploading: { color: 'bg-blue-600', label: `${progress}%`, textColor: 'text-blue-600' },
    complete: { color: 'bg-green-500', label: 'Complete', textColor: 'text-green-600' },
    error: { color: 'bg-red-500', label: 'Failed', textColor: 'text-red-600' },
    cancelled: { color: 'bg-gray-400', label: 'Cancelled', textColor: 'text-gray-500' },
  }[status];

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status icon */}
          {status === 'complete' ? (
            <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : status === 'error' ? (
            <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : status === 'compressing' || status === 'uploading' ? (
            <div className="h-5 w-5 flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : null}

          {/* File name */}
          <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Size info */}
          {originalSize && (
            <span className="text-xs text-gray-400">
              {compressedSize && compressedSize !== originalSize
                ? `${formatBytes(compressedSize)} (${compressionRatio}% smaller)`
                : formatBytes(originalSize)}
            </span>
          )}

          {/* Status label */}
          <span className={`text-xs font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>

          {/* Cancel / Retry */}
          {(status === 'compressing' || status === 'uploading') && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Cancel upload"
            >
              Cancel
            </button>
          )}

          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${statusConfig.color}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Error message */}
      {status === 'error' && error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export default UploadProgress;
