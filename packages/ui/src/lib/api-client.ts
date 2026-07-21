/**
 * Enhanced API Client with Error Handling, Retry Logic, and CSRF Protection
 */

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: any
  timestamp?: string
  path?: string
}

export interface ApiRequestOptions extends RequestInit {
  retries?: number
  retryDelay?: number
  timeout?: number
  onRetry?: (attempt: number, error: Error) => void
  skipCSRF?: boolean // For webhooks and public endpoints
}

const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second
const DEFAULT_TIMEOUT = 30000 // 30 seconds

// CSRF token cache (in-memory, not localStorage)
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create timeout promise
 */
function createTimeout(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Get CSRF token from API
 */
async function getCSRFToken(): Promise<string | null> {
  // Return cached token if still valid (within 23 hours)
  if (csrfToken && Date.now() < csrfTokenExpiry) {
    return csrfToken
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${baseUrl}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      csrfToken = data.csrfToken
      // Set expiry to 23 hours from now (tokens are valid for 24 hours)
      csrfTokenExpiry = Date.now() + 23 * 60 * 60 * 1000
      return csrfToken
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error)
  }

  return null
}

/**
 * Get auth token from storage or context
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  // Try to get from localStorage
  const token = localStorage.getItem('auth_token')
  if (token) return token

  // Try to get from Supabase session if available
  if ((window as any).__SUPABASE__) {
    try {
      const { data: { session } } = await (window as any).__SUPABASE__.auth.getSession()
      return session?.access_token || null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Enhanced API request with error handling, retry logic, and CSRF protection
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    onRetry,
    skipCSRF = false,
    ...fetchOptions
  } = options

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`

  // Get CSRF token for state-changing requests (if not skipped)
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method || 'GET')
  let csrfTokenValue: string | null = null
  if (isStateChanging && !skipCSRF) {
    csrfTokenValue = await getCSRFToken()
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Get auth token
      const token = await getAuthToken()

      // Prepare headers
      const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string> | undefined),
      }

      // Set content type if not FormData
      if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }

      // Add auth token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Add CSRF token for state-changing requests
      if (csrfTokenValue && isStateChanging && !skipCSRF) {
        headers['X-CSRF-Token'] = csrfTokenValue
      }

      // Create fetch promise with timeout
      const fetchPromise = fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      })

      const response = await Promise.race([
        fetchPromise,
        createTimeout(timeout),
      ])

      // Handle CSRF token errors (403 with CSRF_TOKEN_MISSING or CSRF_TOKEN_INVALID)
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error?.code === 'CSRF_TOKEN_MISSING' || errorData.error?.code === 'CSRF_TOKEN_INVALID') {
          // Refresh CSRF token and retry once
          csrfToken = null
          csrfTokenExpiry = 0
          csrfTokenValue = await getCSRFToken()
          
          if (csrfTokenValue) {
            headers['X-CSRF-Token'] = csrfTokenValue
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers,
              credentials: 'include',
            })
            
            if (retryResponse.ok) {
              const contentType = retryResponse.headers.get('content-type')
              if (contentType && contentType.includes('application/json')) {
                return await retryResponse.json()
              }
              return (await retryResponse.text()) as T
            }
          }
        }
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: ApiError

        try {
          const json = await response.json()
          errorData = json.error || json
        } catch {
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          }
        }

        // Don't retry on client errors (4xx) except 408, 429
        if (response.status >= 400 && response.status < 500) {
          if (response.status === 408 || response.status === 429) {
            // Retry on timeout or rate limit
            throw new Error(errorData.message || 'Request failed')
          }
          // Don't retry other 4xx errors
          const error = new Error(errorData.message || 'Request failed') as Error & ApiError
          error.code = errorData.code
          error.statusCode = errorData.statusCode
          error.details = errorData.details
          throw error
        }

        // Retry on server errors (5xx) and network errors
        throw new Error(errorData.message || 'Request failed')
      }

      // Parse response
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return (await response.text()) as T
    } catch (error: any) {
      lastError = error

      // Don't retry on last attempt
      if (attempt === retries) {
        break
      }

      // Don't retry on certain errors
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        if (error.statusCode !== 408 && error.statusCode !== 429) {
          break
        }
      }

      // Calculate exponential backoff delay
      const delay = retryDelay * Math.pow(2, attempt)

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // Wait before retry
      await sleep(delay)
    }
  }

  // All retries failed
  const apiError = lastError as Error & ApiError
  throw apiError
}

/**
 * Log error to console and optionally to error tracking service
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error('API Error:', error, context)

  // Log to Sentry if available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.captureException(error, {
      extra: context,
    })
  }

  // Log to audit service (if API available)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Ignore logging errors
    })
  }
}

