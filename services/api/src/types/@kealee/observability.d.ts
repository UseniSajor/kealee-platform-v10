declare module '@kealee/observability' {
  export function initTracing(serviceName: string): void
  export function createLogger(name?: string): any
  export function withSpan<T>(name: string, fn: () => T): T
  export function withContext(ctx: Record<string, any>, fn: () => any): any
  export function getTraceId(): string | undefined
  export const tracingPlugin: any
  export function createFastifyLogger(opts?: any): any
}
