/**
 * Local stub for @kealee/observability
 * Self-contained pino logger — no monorepo workspace dependency.
 */
import pino, { type Logger } from 'pino'
import os from 'os'

export type { Logger }

export interface CreateLoggerOptions {
  level?: string
  pretty?: boolean
  base?: Record<string, unknown>
}

let _traceId: string | undefined

export function getTraceId(): string | undefined {
  return _traceId
}

export function setTraceId(id: string) {
  _traceId = id
}

export async function withSpan<T>(
  name: string,
  fn: (span: null) => Promise<T>,
): Promise<T> {
  return fn(null)
}

export function createLogger(name: string, options?: CreateLoggerOptions): Logger {
  const isDev = (process.env.NODE_ENV ?? 'development') === 'development'
  const level = options?.level ?? process.env.LOG_LEVEL ?? 'info'

  const base: pino.LoggerOptions = {
    name,
    level,
    base: {
      service: name,
      env: process.env.NODE_ENV ?? 'development',
      pid: process.pid,
      hostname: os.hostname(),
      ...options?.base,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (options?.pretty ?? isDev) {
    base.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
    }
  }

  return pino(base)
}

export function withContext(logger: Logger, context: Record<string, unknown>): Logger {
  return logger.child(context)
}

export function sendAlert(type: string, message: string, data?: unknown): void {
  console.error(`[ALERT:${type}] ${message}`, data ?? '')
}

export async function sendAlertAsync(type: string, message: string, data?: unknown): Promise<void> {
  sendAlert(type, message, data)
}

export type AlertType = 'error' | 'warn' | 'critical'
