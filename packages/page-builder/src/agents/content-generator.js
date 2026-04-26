"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHeroContent = generateHeroContent;
const ai_1 = require("@kealee/ai");
const fallback_content_1 = require("../fallback/fallback-content");
const ai = new ai_1.AIProvider();
async function generateHeroContent(projectType, city, state, budget, timeline) {
    try {
        const response = await ai.reason({
            task: 'Generate a personalized hero section for an AI-powered construction concept page. Return valid JSON only.',
            context: {
                projectType: fallback_content_1.PROJECT_TYPE_LABELS[projectType] || projectType,
                city,
                state,
                budget,
                timeline,
            },
            schema: {
                headline: 'string — compelling headline emphasizing AI concept/3D visualization (max 80 chars)',
                subheadline: 'string — supporting text mentioning concept packages from $99 (max 160 chars)',
                ctaText: 'string — call-to-action button text (max 30 chars)',
            },
            systemPrompt: 'You are a marketing copywriter for Kealee, a construction project management platform. Write compelling headlines for users who want to see their dream project in 3D with AI-generated concepts. Focus on AI concept packages starting at $99. Do NOT mention contractors or contractor matching — users see AI concepts first, then architecture, then permits, then construction. Return ONLY valid JSON, no markdown.',
        });
        const parsed = JSON.parse(response);
        return {
            headline: parsed.headline || (0, fallback_content_1.getFallbackHero)(projectType, city, state).headline,
            subheadline: parsed.subheadline || (0, fallback_content_1.getFallbackHero)(projectType, city, state).subheadline,
            ctaText: parsed.ctaText || 'Get Your AI Concept',
            ctaHref: '#concept-packages',
            projectTypeLabel: fallback_content_1.PROJECT_TYPE_LABELS[projectType] || projectType,
            locationLabel: `${city}, ${state}`,
        };
    }
    catch (err) {
        console.warn('[ContentGenerator] Falling back to default hero:', err.message);
        return (0, fallback_content_1.getFallbackHero)(projectType, city, state);
    }
}
