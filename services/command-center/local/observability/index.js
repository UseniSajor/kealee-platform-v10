/**
 * @kealee/observability — local stub (pino wrapper, no monorepo dep)
 */
import pino from 'pino'
import os from 'os'

let _traceId

export function getTraceId() { return _traceId }
export function setTraceId(id) { _traceId = id }

export async function withSpan(_name, fn) { return fn(null) }

export function createLogger(name, options) {
  const isDev = (process.env.NODE_ENV ?? 'development') === 'development'
  const level = options?.level ?? process.env.LOG_LEVEL ?? 'info'
  const opts = {
    name,
    level,
    base: { service: name, env: process.env.NODE_ENV ?? 'development', pid: process.pid, hostname: os.hostname(), ...options?.base },
    timestamp: pino.stdTimeFunctions.isoTime,
  }
  if (options?.pretty ?? isDev) {
    opts.transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' } }
  }
  return pino(opts)
}

export function withContext(logger, context) { return logger.child(context) }
export function sendAlert(type, message, data) { console.error(`[ALERT:${type}] ${message}`, data ?? '') }
export async function sendAlertAsync(type, message, data) { sendAlert(type, message, data) }
