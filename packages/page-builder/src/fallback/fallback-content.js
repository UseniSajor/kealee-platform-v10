"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUDGET_RANGES = exports.PROJECT_TYPE_LABELS = void 0;
exports.getFallbackHero = getFallbackHero;
exports.getFallbackBudgetBreakdown = getFallbackBudgetBreakdown;
exports.getFallbackTimeline = getFallbackTimeline;
exports.getFallbackPricing = getFallbackPricing;
const PROJECT_TYPE_LABELS = {
    KITCHEN_REMODEL: 'Kitchen Remodel',
    BATHROOM_REMODEL: 'Bathroom Remodel',
    WHOLE_HOME: 'Whole Home Renovation',
    ADDITION: 'Home Addition',
    NEW_CONSTRUCTION: 'New Construction',
    EXTERIOR: 'Exterior Renovation',
    LANDSCAPING: 'Landscaping',
    COMMERCIAL: 'Commercial Project',
};
exports.PROJECT_TYPE_LABELS = PROJECT_TYPE_LABELS;
const BUDGET_RANGES = {
    UNDER_25K: { low: 10000, mid: 17500, high: 25000 },
    RANGE_25K_50K: { low: 25000, mid: 37500, high: 50000 },
    RANGE_50K_100K: { low: 50000, mid: 75000, high: 100000 },
    RANGE_100K_250K: { low: 100000, mid: 175000, high: 250000 },
    OVER_250K: { low: 250000, mid: 375000, high: 500000 },
};
exports.BUDGET_RANGES = BUDGET_RANGES;
function getFallbackHero(projectType, city, state) {
    const label = PROJECT_TYPE_LABELS[projectType] || 'Home Project';
    return {
        headline: `See Your Dream ${label} in 3D — From $99`,
        subheadline: `Get an AI-powered concept for your ${label.toLowerCase()} in ${city}, ${state}. Choose from 3 packages and see your vision come to life before committing to major costs.`,
        ctaText: 'Get Your AI Concept',
        ctaHref: '#concept-packages',
        projectTypeLabel: label,
        locationLabel: `${city}, ${state}`,
    };
}
function getFallbackBudgetBreakdown(projectType, budget) {
    const range = BUDGET_RANGES[budget] || BUDGET_RANGES.RANGE_50K_100K;
    const lineItems = [
        { category: 'Materials', lowEstimate: range.low * 0.35, midEstimate: range.mid * 0.35, highEstimate: range.high * 0.35, percentage: 35 },
        { category: 'Labor', lowEstimate: range.low * 0.40, midEstimate: range.mid * 0.40, highEstimate: range.high * 0.40, percentage: 40 },
        { category: 'Design & Planning', lowEstimate: range.low * 0.10, midEstimate: range.mid * 0.10, highEstimate: range.high * 0.10, percentage: 10 },
        { category: 'Permits & Inspections', lowEstimate: range.low * 0.05, midEstimate: range.mid * 0.05, highEstimate: range.high * 0.05, percentage: 5 },
        { category: 'Contingency', lowEstimate: range.low * 0.10, midEstimate: range.mid * 0.10, highEstimate: range.high * 0.10, percentage: 10 },
    ];
    return {
        title: `${PROJECT_TYPE_LABELS[projectType] || 'Project'} Budget Breakdown`,
        totalLow: range.low,
        totalMid: range.mid,
        totalHigh: range.high,
        lineItems,
        notes: 'Estimates based on industry averages for your area. Actual costs may vary based on materials, scope, and design selections.',
    };
}
function getFallbackTimeline(projectType) {
    const phases = [
        { name: 'AI Concept & Design', durationWeeks: 1, description: 'AI generates your concept, you review and approve', order: 1 },
        { name: 'Architecture Phase', durationWeeks: 4, description: 'Full architectural plans based on approved concept', order: 2 },
        { name: 'Permits (Kealee Handles)', durationWeeks: 4, description: 'Permit applications and approvals — we manage it all', order: 3 },
        { name: 'Construction Phase', durationWeeks: 8, description: 'Build phase with real-time tracking on Kealee platform', order: 4 },
        { name: 'Final Inspection', durationWeeks: 1, description: 'Quality check, punch list, final walkthrough', order: 5 },
    ];
    const totalWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
    return {
        title: 'Your Project Journey',
        totalWeeks,
        phases,
    };
}
function getFallbackPricing(budget) {
    return {
        title: 'AI Concept Packages',
        tiers: [
            {
                label: 'Basic',
                price: 9900,
                description: 'Perfect for exploring your vision',
                features: ['AI-generated floor plan', '3D concept visualization', 'Budget estimate report', '48-hour delivery'],
            },
            {
                label: 'Enhanced',
                price: 49900,
                description: 'Best value — compare multiple designs',
                features: ['Everything in Basic', '3 design options', 'Materials recommendation', 'Detailed cost breakdown', '1 revision round'],
            },
            {
                label: 'Premium',
                price: 89900,
                description: 'The full experience before you build',
                features: ['Everything in Enhanced', 'Photo-realistic renders', 'Virtual walkthrough tour', 'ROI analysis', 'Priority 24-hour delivery', '2 revision rounds'],
            },
        ],
    };
}
