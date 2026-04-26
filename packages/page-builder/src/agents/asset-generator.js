"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBudgetAndTimeline = generateBudgetAndTimeline;
const ai_1 = require("@kealee/ai");
const fallback_content_1 = require("../fallback/fallback-content");
const ai = new ai_1.AIProvider();
async function generateBudgetAndTimeline(projectType, budget, timeline, city, state) {
    try {
        const range = fallback_content_1.BUDGET_RANGES[budget] || fallback_content_1.BUDGET_RANGES.RANGE_50K_100K;
        const response = await ai.reason({
            task: `Generate a budget breakdown, project timeline, and pricing tiers for a ${fallback_content_1.PROJECT_TYPE_LABELS[projectType] || projectType} project in ${city}, ${state}. Budget range: $${range.low.toLocaleString()} - $${range.high.toLocaleString()}. Timeline preference: ${timeline}. Return valid JSON only.`,
            context: {
                projectType: fallback_content_1.PROJECT_TYPE_LABELS[projectType] || projectType,
                city,
                state,
                budgetLow: range.low,
                budgetMid: range.mid,
                budgetHigh: range.high,
                timeline,
            },
            schema: {
                budgetLineItems: [
                    { category: 'string', percentage: 'number (0-100)' },
                ],
                phases: [
                    { name: 'string', durationWeeks: 'number', description: 'string' },
                ],
                notes: 'string — budget notes',
            },
            systemPrompt: 'You are a construction cost estimator for the Kealee platform. Provide realistic budget breakdowns and timelines based on DC/MD/VA market rates. Return ONLY valid JSON, no markdown.',
        });
        const parsed = JSON.parse(response);
        // Build budget breakdown from AI response
        const lineItems = (parsed.budgetLineItems || []).map((item) => ({
            category: item.category,
            lowEstimate: range.low * (item.percentage / 100),
            midEstimate: range.mid * (item.percentage / 100),
            highEstimate: range.high * (item.percentage / 100),
            percentage: item.percentage,
        }));
        const budgetBreakdown = {
            title: `${fallback_content_1.PROJECT_TYPE_LABELS[projectType] || 'Project'} Budget Breakdown`,
            totalLow: range.low,
            totalMid: range.mid,
            totalHigh: range.high,
            lineItems: lineItems.length > 0 ? lineItems : (0, fallback_content_1.getFallbackBudgetBreakdown)(projectType, budget).lineItems,
            notes: parsed.notes || 'Estimates based on local market rates.',
        };
        // Build timeline from AI response
        const phases = (parsed.phases || []).map((phase, idx) => ({
            name: phase.name,
            durationWeeks: phase.durationWeeks,
            description: phase.description,
            order: idx + 1,
        }));
        const timelineData = {
            title: 'Estimated Project Timeline',
            totalWeeks: phases.reduce((s, p) => s + p.durationWeeks, 0) || 9,
            phases: phases.length > 0 ? phases : (0, fallback_content_1.getFallbackTimeline)(projectType).phases,
        };
        return {
            budgetBreakdown,
            timeline: timelineData,
            pricing: (0, fallback_content_1.getFallbackPricing)(budget),
        };
    }
    catch (err) {
        console.warn('[AssetGenerator] Falling back to defaults:', err.message);
        return {
            budgetBreakdown: (0, fallback_content_1.getFallbackBudgetBreakdown)(projectType, budget),
            timeline: (0, fallback_content_1.getFallbackTimeline)(projectType),
            pricing: (0, fallback_content_1.getFallbackPricing)(budget),
        };
    }
}
