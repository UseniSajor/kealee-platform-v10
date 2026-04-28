import type { Logger } from 'pino'
export type { Logger }

export interface CreateLoggerOptions { level?: string; pretty?: boolean; base?: Record<string, unknown> }
export type AlertType = 'error' | 'warn' | 'critical'

export function getTraceId(): string | undefined
export function setTraceId(id: string): void
export function withSpan<T>(name: string, fn: (span: null) => Promise<T>): Promise<T>
export function createLogger(name: string, options?: CreateLoggerOptions): Logger
export function withContext(logger: Logger, context: Record<string, unknown>): Logger
export function sendAlert(type: string, message: string, data?: unknown): void
export function sendAlertAsync(type: string, message: string, data?: unknown): Promise<void>
