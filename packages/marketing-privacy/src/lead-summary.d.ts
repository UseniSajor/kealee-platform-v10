/** Aggregate-only lead metrics — no row-level PII. */
export interface LeadSummaryInput {
    project_path?: string | null;
    status?: string | null;
    source_channel?: string | null;
    routing_tag?: string | null;
    lead_tier?: string | null;
    created_at?: string | null;
}
export interface LeadSummary {
    total: number;
    today: number;
    thisWeek: number;
    bySource: Record<string, number>;
    byService: Record<string, number>;
    byTier: Record<string, number>;
    byStatus: Record<string, number>;
    hotCount: number;
    convertedCount: number;
    capacityPerDay: number;
}
export declare function computeLeadSummary(rows: LeadSummaryInput[], capacityPerDay?: number): LeadSummary;
