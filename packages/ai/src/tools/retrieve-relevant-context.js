"use strict";
/**
 * packages/ai/src/tools/retrieve-relevant-context.ts
 *
 * Claude tool definition + handler for RAG retrieval.
 * Used by all KeaBots as a registered tool.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETRIEVE_CONTEXT_TOOL_DEF = void 0;
exports.retrieveRelevantContext = retrieveRelevantContext;
const retriever_js_1 = require("../rag/retriever.js");
/**
 * Tool handler — call from bot tool registration
 */
async function retrieveRelevantContext(params) {
    const filters = {};
    if (params.jurisdiction)
        filters.jurisdiction = params.jurisdiction;
    if (params.serviceType)
        filters.serviceType = params.serviceType;
    if (params.projectId)
        filters.projectId = params.projectId;
    if (params.sourceType)
        filters.sourceType = params.sourceType;
    const results = await (0, retriever_js_1.retrieveContext)({
        query: params.query,
        filters,
        topK: params.topK ?? 5,
        threshold: params.threshold ?? 0.70,
    });
    return {
        context: (0, retriever_js_1.formatContext)(results),
        resultCount: results.length,
        results,
    };
}
/**
 * Claude tool definition — register this in any KeaBot
 */
exports.RETRIEVE_CONTEXT_TOOL_DEF = {
    name: 'retrieve_relevant_context',
    description: 'Retrieve relevant context from the Kealee knowledge base (RAG) for permits, estimates, projects, jurisdictions, and service catalog. Always call this before answering domain-specific questions.',
    parameters: {
        query: {
            type: 'string',
            description: 'Natural language search query describing what context to find',
            required: true,
        },
        jurisdiction: {
            type: 'string',
            description: 'Filter by jurisdiction (e.g. "montgomery-county", "dc", "fairfax")',
            required: false,
        },
        serviceType: {
            type: 'string',
            description: 'Filter by service type (e.g. "permit", "estimate", "concept")',
            required: false,
        },
        projectId: {
            type: 'string',
            description: 'Filter to a specific project',
            required: false,
        },
        sourceType: {
            type: 'string',
            description: 'Filter by document type: PERMIT_APPLICATION, ESTIMATE, JURISDICTION_GUIDE, CONCEPT_REPORT, etc.',
            required: false,
        },
        topK: {
            type: 'number',
            description: 'Max results to return (default 5)',
            required: false,
        },
        threshold: {
            type: 'number',
            description: 'Minimum similarity score 0–1 (default 0.70)',
            required: false,
        },
    },
    handler: retrieveRelevantContext,
};
