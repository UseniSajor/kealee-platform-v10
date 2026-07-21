declare module '@kealee/audit' {
  export type AuditEntry = Record<string, any>

  export type AuditSearchFilters = Record<string, any>

  export interface AuditSearchResult {
    [key: string]: any
  }

  export interface AuditLogRecord {
    [key: string]: any
  }

  export interface AuditStats {
    [key: string]: any
  }

  export class AuditClient {
    constructor(options?: any)
    log(entry: AuditEntry): Promise<void>
    search(filters: AuditSearchFilters): Promise<AuditSearchResult>
    getStats(filters?: AuditSearchFilters): Promise<AuditStats>
    flush(): Promise<void>
    [key: string]: any
  }
}
