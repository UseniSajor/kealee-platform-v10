/**
 * Real-Time Notifications Service (Enhancement 6)
 * WebSocket-based live updates for deliverable processing
 * Pattern: Processing started → Push updates via WebSocket → Completed with URLs
 */

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | 'processing_started'
  | 'pdf_generated'
  | 'images_generated'
  | 'upload_started'
  | 'upload_progress'
  | 'upload_completed'
  | 'email_sent'
  | 'processing_completed'
  | 'processing_failed'

export interface NotificationPayload {
  type: NotificationType
  intakeId: string
  projectId?: string
  serviceType: 'concept' | 'estimation' | 'permit'
  status: 'pending' | 'processing' | 'success' | 'error'
  timestamp: string
  message: string
  progress?: {
    current: number
    total: number
    percentage: number
  }
  data?: {
    pdfUrl?: string
    conceptImageUrls?: string[]
    estimationPdfUrl?: string
    permitFileUrls?: string[]
    error?: string
  }
}

// ============================================================================
// In-Memory Notification Manager
// ============================================================================

class NotificationManager {
  private subscribers: Map<string, Set<(payload: NotificationPayload) => void>> = new Map()
  private history: Map<string, NotificationPayload[]> = new Map()
  private readonly maxHistorySize = 100

  subscribe(intakeId: string, callback: (payload: NotificationPayload) => void): () => void {
    if (!this.subscribers.has(intakeId)) {
      this.subscribers.set(intakeId, new Set())
    }

    this.subscribers.get(intakeId)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(intakeId)?.delete(callback)
      if (this.subscribers.get(intakeId)?.size === 0) {
        this.subscribers.delete(intakeId)
      }
    }
  }

  publish(payload: NotificationPayload): void {
    // Store in history
    if (!this.history.has(payload.intakeId)) {
      this.history.set(payload.intakeId, [])
    }

    const history = this.history.get(payload.intakeId)!
    history.push(payload)

    // Keep history size manageable
    if (history.length > this.maxHistorySize) {
      history.shift()
    }

    // Publish to all subscribers
    const callbacks = this.subscribers.get(payload.intakeId)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload)
        } catch (err) {
          console.error('[Notifications] Callback error:', err)
        }
      })
    }

    console.log('[Notifications] Published:', {
      intakeId: payload.intakeId,
      type: payload.type,
      status: payload.status,
    })
  }

  getHistory(intakeId: string): NotificationPayload[] {
    return this.history.get(intakeId) || []
  }

  clearHistory(intakeId: string): void {
    this.history.delete(intakeId)
  }
}

// Singleton instance
export const notificationManager = new NotificationManager()

// ============================================================================
// Notification Events
// ============================================================================

export function notifyProcessingStarted(intakeId: string, projectId?: string, serviceType: any = 'concept'): void {
  notificationManager.publish({
    type: 'processing_started',
    intakeId,
    projectId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: 'Starting deliverable generation...',
  })
}

export function notifyPDFGenerated(intakeId: string, serviceType: any = 'concept'): void {
  notificationManager.publish({
    type: 'pdf_generated',
    intakeId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: 'PDF generated successfully',
    progress: { current: 1, total: 3, percentage: 33 },
  })
}

export function notifyImagesGenerated(intakeId: string, imageUrls: string[]): void {
  notificationManager.publish({
    type: 'images_generated',
    intakeId,
    serviceType: 'concept',
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: `Generated ${imageUrls.length} concept images`,
    progress: { current: 1, total: 3, percentage: 33 },
    data: { conceptImageUrls: imageUrls },
  })
}

export function notifyUploadStarted(intakeId: string, serviceType: any = 'concept'): void {
  notificationManager.publish({
    type: 'upload_started',
    intakeId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: 'Uploading to cloud storage...',
    progress: { current: 2, total: 3, percentage: 66 },
  })
}

export function notifyUploadProgress(
  intakeId: string,
  current: number,
  total: number,
  serviceType: any = 'concept'
): void {
  const percentage = Math.round((current / total) * 100)

  notificationManager.publish({
    type: 'upload_progress',
    intakeId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: `Upload progress: ${percentage}%`,
    progress: { current, total, percentage },
  })
}

export function notifyUploadCompleted(intakeId: string, fileUrls: string[], serviceType: any = 'concept'): void {
  let data: any = {}

  switch (serviceType) {
    case 'concept':
      data.conceptImageUrls = fileUrls
      break
    case 'estimation':
      data.estimationPdfUrl = fileUrls[0]
      break
    case 'permit':
      data.permitFileUrls = fileUrls
      break
  }

  notificationManager.publish({
    type: 'upload_completed',
    intakeId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: 'Files uploaded successfully',
    progress: { current: 2, total: 3, percentage: 66 },
    data,
  })
}

export function notifyEmailSent(intakeId: string, email: string, serviceType: any = 'concept'): void {
  notificationManager.publish({
    type: 'email_sent',
    intakeId,
    serviceType,
    status: 'processing',
    timestamp: new Date().toISOString(),
    message: `Deliverable email sent to ${email}`,
    progress: { current: 3, total: 3, percentage: 100 },
  })
}

export function notifyProcessingCompleted(
  intakeId: string,
  data: {
    pdfUrl?: string
    conceptImageUrls?: string[]
    estimationPdfUrl?: string
    permitFileUrls?: string[]
  },
  serviceType: any = 'concept'
): void {
  notificationManager.publish({
    type: 'processing_completed',
    intakeId,
    serviceType,
    status: 'success',
    timestamp: new Date().toISOString(),
    message: 'Deliverable ready for download!',
    progress: { current: 3, total: 3, percentage: 100 },
    data,
  })
}

export function notifyProcessingFailed(intakeId: string, error: string, serviceType: any = 'concept'): void {
  notificationManager.publish({
    type: 'processing_failed',
    intakeId,
    serviceType,
    status: 'error',
    timestamp: new Date().toISOString(),
    message: `Processing failed: ${error}`,
    data: { error },
  })
}

// ============================================================================
// API Endpoints for WebSocket Integration
// ============================================================================

/**
 * GET /api/notifications/:intakeId/history
 * Returns notification history for a specific intake
 */
export function getNotificationHistory(intakeId: string): NotificationPayload[] {
  return notificationManager.getHistory(intakeId)
}

/**
 * WS /api/notifications/:intakeId
 * WebSocket endpoint for real-time notifications
 *
 * Usage (Frontend):
 * ```typescript
 * const ws = new WebSocket(`wss://api.kealee.com/api/notifications/${intakeId}`);
 *
 * ws.onmessage = (event) => {
 *   const notification = JSON.parse(event.data);
 *   console.log('Update:', notification);
 *
 *   // Update UI based on notification type
 *   if (notification.type === 'processing_completed') {
 *     // Show results
 *   } else if (notification.type === 'processing_failed') {
 *     // Show error
 *   } else {
 *     // Update progress bar
 *   }
 * };
 * ```
 */

// ============================================================================
// Frontend Hook (useRealtimeNotifications)
// ============================================================================

/**
 * React Hook for Real-Time Notifications
 *
 * Usage in Frontend:
 * ```typescript
 * function ResultsPage() {
 *   const { status, progress, data, error } = useRealtimeNotifications(intakeId);
 *
 *   return (
 *     <>
 *       {progress && (
 *         <ProgressBar value={progress.percentage} />
 *       )}
 *       {status === 'success' && (
 *         <DownloadButton url={data.pdfUrl} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * Implementation (React):
 * ```typescript
 * import { useEffect, useState } from 'react';
 * import { NotificationPayload } from '@kealee/api';
 *
 * export function useRealtimeNotifications(intakeId: string) {
 *   const [status, setStatus] = useState('pending');
 *   const [progress, setProgress] = useState(null);
 *   const [data, setData] = useState(null);
 *   const [error, setError] = useState(null);
 *
 *   useEffect(() => {
 *     const ws = new WebSocket(
 *       `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/notifications/${intakeId}`
 *     );
 *
 *     ws.onmessage = (event) => {
 *       const notification = JSON.parse(event.data) as NotificationPayload;
 *
 *       if (notification.progress) {
 *         setProgress(notification.progress);
 *       }
 *
 *       if (notification.data) {
 *         setData(notification.data);
 *       }
 *
 *       if (notification.status === 'error') {
 *         setError(notification.message);
 *       }
 *
 *       setStatus(notification.status);
 *     };
 *
 *     return () => ws.close();
 *   }, [intakeId]);
 *
 *   return { status, progress, data, error };
 * }
 * ```
 */

// ============================================================================
// Integration with Deliverable Processing
// ============================================================================

/**
 * Example: Wrap concept deliverable generation with notifications
 *
 * ```typescript
 * export async function persistConceptDeliverableWithNotifications(
 *   intakeId: string,
 *   conceptData: any,
 *   deps: { prisma: any }
 * ) {
 *   notifyProcessingStarted(intakeId, undefined, 'concept');
 *
 *   try {
 *     // Generate PDF
 *     const pdfBuffer = await generateConceptPDF(conceptData);
 *     notifyPDFGenerated(intakeId, 'concept');
 *
 *     // Generate images
 *     const imageUrls = await generateConceptImages(conceptData);
 *     notifyImagesGenerated(intakeId, imageUrls);
 *
 *     // Upload to Supabase
 *     notifyUploadStarted(intakeId, 'concept');
 *     const uploadResult = await uploadConceptDeliverable({...}, deps);
 *     notifyUploadCompleted(intakeId, uploadResult.conceptImageUrls, 'concept');
 *
 *     // Send email
 *     const emailResult = await sendDeliverableEmail({
 *       serviceType: 'concept',
 *       customerEmail,
 *       projectTitle,
 *       pdfUrl: uploadResult.pdfUrl,
 *       conceptImageUrls: uploadResult.conceptImageUrls,
 *     });
 *
 *     if (emailResult.success) {
 *       notifyEmailSent(intakeId, customerEmail, 'concept');
 *     }
 *
 *     notifyProcessingCompleted(intakeId, uploadResult, 'concept');
 *     return uploadResult;
 *   } catch (err) {
 *     notifyProcessingFailed(intakeId, err.message, 'concept');
 *     throw err;
 *   }
 * }
 * ```
 */
