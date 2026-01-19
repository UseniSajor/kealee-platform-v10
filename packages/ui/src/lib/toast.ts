/**
 * Toast Notification System
 * Uses sonner if available, falls back to console
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  duration?: number
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

let toastImpl: {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
} | null = null

/**
 * Initialize toast system
 */
export function initToast() {
  if (typeof window === 'undefined') return

  // Try to use sonner
  try {
    const { toast: sonnerToast } = require('sonner')
    toastImpl = {
      success: (message, options) => sonnerToast.success(message, { duration: options?.duration || 5000, description: options?.description }),
      error: (message, options) => sonnerToast.error(message, { duration: options?.duration || 5000, description: options?.description }),
      warning: (message, options) => sonnerToast.warning(message, { duration: options?.duration || 5000, description: options?.description }),
      info: (message, options) => sonnerToast.info(message, { duration: options?.duration || 5000, description: options?.description }),
    }
    return
  } catch {
    // Sonner not available
  }

  // Try to use react-hot-toast
  try {
    const { toast: hotToast } = require('react-hot-toast')
    toastImpl = {
      success: (message, options) => hotToast.success(message, { duration: options?.duration || 5000 }),
      error: (message, options) => hotToast.error(message, { duration: options?.duration || 5000 }),
      warning: (message, options) => hotToast(message, { duration: options?.duration || 5000, icon: '⚠️' }),
      info: (message, options) => hotToast(message, { duration: options?.duration || 5000, icon: 'ℹ️' }),
    }
    return
  } catch {
    // react-hot-toast not available
  }

  // Fallback to console
  toastImpl = {
    success: (message, options) => {
      console.log('✅', message, options?.description || '')
    },
    error: (message, options) => {
      console.error('❌', message, options?.description || '')
    },
    warning: (message, options) => {
      console.warn('⚠️', message, options?.description || '')
    },
    info: (message, options) => {
      console.info('ℹ️', message, options?.description || '')
    },
  }
}

/**
 * Show success toast
 */
export function toastSuccess(message: string, options?: ToastOptions) {
  if (!toastImpl) initToast()
  toastImpl?.success(message, options)
}

/**
 * Show error toast
 */
export function toastError(message: string, options?: ToastOptions) {
  if (!toastImpl) initToast()
  toastImpl?.error(message, options)
}

/**
 * Show warning toast
 */
export function toastWarning(message: string, options?: ToastOptions) {
  if (!toastImpl) initToast()
  toastImpl?.warning(message, options)
}

/**
 * Show info toast
 */
export function toastInfo(message: string, options?: ToastOptions) {
  if (!toastImpl) initToast()
  toastImpl?.info(message, options)
}

/**
 * Show toast based on type
 */
export function toast(type: ToastType, message: string, options?: ToastOptions) {
  switch (type) {
    case 'success':
      toastSuccess(message, options)
      break
    case 'error':
      toastError(message, options)
      break
    case 'warning':
      toastWarning(message, options)
      break
    case 'info':
      toastInfo(message, options)
      break
  }
}

/**
 * Handle API error and show appropriate toast
 */
export function handleApiError(error: any, defaultMessage = 'An error occurred') {
  const message = error?.message || error?.error?.message || defaultMessage
  const statusCode = error?.statusCode || error?.error?.statusCode

  // Show user-friendly message based on status code
  if (statusCode === 401) {
    toastError('Please sign in to continue')
  } else if (statusCode === 403) {
    toastError('You do not have permission to perform this action')
  } else if (statusCode === 404) {
    toastError('The requested resource was not found')
  } else if (statusCode === 429) {
    toastWarning('Too many requests. Please try again later.')
  } else if (statusCode >= 500) {
    toastError('Server error. Please try again later.')
  } else {
    toastError(message)
  }

  return message
}
