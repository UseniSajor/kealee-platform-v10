"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
/**
 * AIProvider — Claude primary, OpenAI automatic fallback.
 * See: _docs/kealee-architecture.md §15
 *
 * AI THINKS inside claws — it does not RUN them.
 */
class AIProvider {
    constructor() {
        this.claude = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Reason about a task with context.
     * Claude is primary (claude-sonnet-4-20250514). Auto-failover to OpenAI gpt-4o-mini.
     */
    async reason(params) {
        const systemPrompt = params.systemPrompt ??
            'You are a construction management AI assistant for the Kealee platform. Provide precise, actionable responses based on the data provided.';
        const userMessage = `Task: ${params.task}\n\nContext:\n${JSON.stringify(params.context, null, 2)}${params.schema ? `\n\nExpected Output Schema:\n${JSON.stringify(params.schema, null, 2)}` : ''}`;
        // Try Claude first (default), fall back to OpenAI
        if (params.provider !== 'openai') {
            try {
                const response = await this.claude.messages.create({
                    model: params.model ?? 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userMessage }],
                });
                return this.parseClaudeResponse(response);
            }
            catch (err) {
                console.warn('[AIProvider] Claude failed, falling back to OpenAI:', err.message);
                return this.reason({ ...params, provider: 'openai' });
            }
        }
        // OpenAI fallback
        try {
            const response = await this.openai.chat.completions.create({
                model: params.model ?? 'gpt-4o-mini',
                max_tokens: 4096,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
            });
            return response.choices[0]?.message?.content ?? '';
        }
        catch (err) {
            console.error('[AIProvider] OpenAI also failed:', err.message);
            throw new Error(`AI reasoning failed: both Claude and OpenAI unavailable`);
        }
    }
    /**
     * Analyze an image — ALWAYS uses Claude Vision API.
     */
    async analyzeImage(imageUrl, task) {
        try {
            const response = await this.claude.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: { type: 'url', url: imageUrl },
                            },
                            {
                                type: 'text',
                                text: task,
                            },
                        ],
                    },
                ],
            });
            return this.parseClaudeResponse(response);
        }
        catch (err) {
            console.error('[AIProvider] Image analysis failed:', err.message);
            throw err;
        }
    }
    /**
     * Extract text content from Claude API response.
     */
    parseClaudeResponse(response) {
        for (const block of response.content) {
            if (block.type === 'text')
                return block.text ?? '';
        }
        return '';
    }
}
exports.AIProvider = AIProvider;
