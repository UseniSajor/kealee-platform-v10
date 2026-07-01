"use strict";
/** Aggregate-only lead metrics — no row-level PII. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLeadSummary = computeLeadSummary;
function bump(map, key) {
    const k = key || 'unknown';
    map[k] = (map[k] ?? 0) + 1;
}
function computeLeadSummary(rows, capacityPerDay = 50) {
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const bySource = {};
    const byService = {};
    const byTier = {};
    const byStatus = {};
    let today = 0;
    let thisWeek = 0;
    let hotCount = 0;
    let convertedCount = 0;
    const convertedStatuses = new Set(['paid', 'concept_ready', 'processing']);
    for (const row of rows) {
        bump(bySource, row.source_channel ?? 'unknown');
        bump(byService, row.project_path ?? 'unknown');
        bump(byTier, row.lead_tier ?? row.routing_tag ?? 'unknown');
        bump(byStatus, row.status ?? 'unknown');
        const created = row.created_at ? new Date(row.created_at).getTime() : 0;
        if (created >= dayStart.getTime())
            today++;
        if (created >= weekAgo)
            thisWeek++;
        if (row.routing_tag === 'hot')
            hotCount++;
        if (row.status && convertedStatuses.has(row.status))
            convertedCount++;
    }
    return {
        total: rows.length,
        today,
        thisWeek,
        bySource,
        byService,
        byTier,
        byStatus,
        hotCount,
        convertedCount,
        capacityPerDay,
    };
}
