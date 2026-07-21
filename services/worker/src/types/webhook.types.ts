/**
 * Webhook job data types
 */

export interface WebhookJobData {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number // milliseconds
  retries?: number // Override default retries
  metadata?: {
    userId?: string
    orgId?: string
    eventType?: string
    webhookId?: string
    [key: string]: any
  }
}

export interface WebhookResponse {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body?: any
  duration: number // milliseconds
}

export interface WebhookDeliveryResult {
  success: boolean
  response?: WebhookResponse
  error?: string
  attempt: number
  deliveredAt?: Date
}
