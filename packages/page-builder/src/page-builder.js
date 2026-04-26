"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPage = buildPage;
const data_aggregator_1 = require("./agents/data-aggregator");
const content_generator_1 = require("./agents/content-generator");
const asset_generator_1 = require("./agents/asset-generator");
const layout_designer_1 = require("./agents/layout-designer");
const page_cache_1 = require("./cache/page-cache");
const progress_tracker_1 = require("./progress/progress-tracker");
async function buildPage(request) {
    const { sessionId, userType, projectType, city, state, budget, timeline } = request;
    // Check cache first
    const cached = await (0, page_cache_1.getCachedPage)(sessionId);
    if (cached)
        return cached;
    await (0, progress_tracker_1.setProgress)(sessionId, 5);
    // Step 1: Data aggregation (pure DB queries, fast)
    await (0, progress_tracker_1.setProgress)(sessionId, 10);
    const [conceptData, caseStudyData] = await Promise.all([
        (0, data_aggregator_1.aggregateConceptPackages)(),
        (0, data_aggregator_1.aggregateCaseStudies)(projectType, state),
    ]);
    await (0, progress_tracker_1.setProgress)(sessionId, 30);
    // Step 2: AI content + asset generation in parallel (2 Claude calls)
    const [heroData, { budgetBreakdown, timeline: timelineData, pricing }] = await Promise.all([
        (0, content_generator_1.generateHeroContent)(projectType, city, state, budget, timeline),
        (0, asset_generator_1.generateBudgetAndTimeline)(projectType, budget, timeline, city, state),
    ]);
    await (0, progress_tracker_1.setProgress)(sessionId, 80);
    // Step 3: Layout design (static lookup, no AI)
    const layout = (0, layout_designer_1.getLayout)(userType);
    // Build section data map
    const sectionDataMap = {
        hero: heroData,
        concept_packages: conceptData,
        budget_breakdown: budgetBreakdown,
        timeline: timelineData,
        pricing_grid: pricing,
        case_studies: caseStudyData,
    };
    const sections = layout.map((type) => ({
        type,
        data: sectionDataMap[type],
    }));
    const result = {
        sessionId,
        sections,
        layout,
        generatedAt: new Date().toISOString(),
    };
    // Cache result
    await (0, page_cache_1.setCachedPage)(sessionId, result);
    await (0, progress_tracker_1.setProgress)(sessionId, 100);
    return result;
}
