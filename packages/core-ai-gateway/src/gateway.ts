/**
 * core-ai-gateway/gateway.ts
 * Single internal API for all AI operations in KeaCore.
 *
 * All calls go through this gateway, which:
 *   1. Decides the provider via router
 *   2. Builds retrieval context
 *   3. Executes the provider call
 *   4. Records the run via llm-run-recorder
 *   5. Falls back if confidence is below threshold or primary fails
 *   6. Returns a structured result
 *
 * NEVER call providers directly from KeaCore runtime.
 * Always go through the gateway.
 */

import {
  buildContext,
  ClassifyArgs,
  ClassifyResult,
  decideRoute,
  EmbedArgs,
  EmbedResult,
  GenerateObjectArgs,
  GenerateObjectResult,
  GenerateTextArgs,
  GenerateTextResult,
  needsFallback,
  NormalizedIntake,
  providerRegistry,
  recordRun,
  RerankArgs,
  RerankResult,
  resolveFallback,
  SessionMemorySnapshot,
} from "@kealee/core-llm";
import { RoutingContext } from "@kealee/core-llm";

// ─── Gateway call args ────────────────────────────────────────────────────────

interface GatewayBaseArgs {
  routingContext?: RoutingContext;
  /** Intake data for retrieval context building */
  intake?: NormalizedIntake;
  /** Session memory for context building */
  memory?: SessionMemorySnapshot;
  /** Override to skip retrieval (for embedding/rerank) */
  skipRetrieval?: boolean;
  sessionId?: string;
  taskId?: string;
  projectId?: string;
  workflowCode?: string;
  stepCode?: string;
  actorType?: "user" | "system" | "operator";
  actorId?: string;
}

export interface GatewayGenerateTextArgs extends GenerateTextArgs, GatewayBaseArgs {}
export interface GatewayGenerateObjectArgs<T> extends GenerateObjectArgs<T>, GatewayBaseArgs {}
export interface GatewayClassifyArgs<TLabel extends string> extends ClassifyArgs<TLabel>, GatewayBaseArgs {}
export interface GatewayEmbedArgs extends EmbedArgs, GatewayBaseArgs {}
export interface GatewayRerankArgs extends RerankArgs, GatewayBaseArgs {}

// ─── Gateway class ────────────────────────────────────────────────────────────

export class AiGateway {
  async generateText(args: GatewayGenerateTextArgs): Promise<GenerateTextResult> {
    const context = args.routingContext ?? "general";
    const route = decideRoute(context);
    const provider = providerRegistry.resolve(route.selectedProvider);

    // Build retrieval context if intake is provided
    let contextText = "";
    let contextBlockIds: string[] = [];
    if (!args.skipRetrieval && args.intake) {
      const built = buildContext(args.intake, args.memory);
      contextText = built.contextText;
      contextBlockIds = built.blockIds;
    }

    const enrichedPrompt = contextText
      ? `${args.prompt}\n\n---\nRELEVANT CONTEXT:\n${contextText}`
      : args.prompt;

    const start = Date.now();
    let result: GenerateTextResult;
    let usedFallback = false;
    let usedProvider = route.selectedProvider;

    try {
      result = await provider.generateText({ ...args, prompt: enrichedPrompt });

      // Check if we need to fall back due to low confidence
      if (needsFallback(result.confidence, "internal_summary") && !usedFallback) {
        const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
        if (fallback) {
          const fallbackProvider = providerRegistry.resolve(fallback);
          result = await fallbackProvider.generateText({ ...args, prompt: enrichedPrompt });
          usedFallback = true;
          usedProvider = fallback;
        }
      }
    } catch (err) {
      // Primary failed — try fallback
      const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
      if (fallback) {
        const fallbackProvider = providerRegistry.resolve(fallback);
        result = await fallbackProvider.generateText({ ...args, prompt: enrichedPrompt });
        usedFallback = true;
        usedProvider = fallback;
      } else {
        throw err;
      }
    }

    recordRun({
      provider: usedProvider,
      model: result.model,
      operation: "generateText",
      routeDecision: route,
      confidence: result.confidence,
      fallbackUsed: usedFallback,
      sessionId: args.sessionId,
      taskId: args.taskId,
      projectId: args.projectId,
      workflowCode: args.workflowCode,
      stepCode: args.stepCode,
      actorType: args.actorType,
      actorId: args.actorId,
      promptSnapshot: args.prompt,
      retrievedContextRefs: contextBlockIds,
      latencyMs: Date.now() - start,
    });

    return { ...result, fallbackUsed: usedFallback };
  }

  async generateObject<T>(args: GatewayGenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    const context = args.routingContext ?? "general";
    const route = decideRoute(context);
    const provider = providerRegistry.resolve(route.selectedProvider);

    let contextText = "";
    let contextBlockIds: string[] = [];
    if (!args.skipRetrieval && args.intake) {
      const built = buildContext(args.intake, args.memory);
      contextText = built.contextText;
      contextBlockIds = built.blockIds;
    }

    const enrichedPrompt = contextText
      ? `${args.prompt}\n\n---\nRELEVANT CONTEXT:\n${contextText}`
      : args.prompt;

    const start = Date.now();
    let result: GenerateObjectResult<T>;
    let usedFallback = false;
    let usedProvider = route.selectedProvider;

    try {
      result = await provider.generateObject({ ...args, prompt: enrichedPrompt });

      // Fall back if parse failed or confidence too low
      if ((result.parseError || needsFallback(result.confidence, "internal_summary")) && !usedFallback) {
        const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
        if (fallback) {
          const fallbackProvider = providerRegistry.resolve(fallback);
          result = await fallbackProvider.generateObject({ ...args, prompt: enrichedPrompt });
          usedFallback = true;
          usedProvider = fallback;
        }
      }
    } catch (err) {
      const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
      if (fallback) {
        const fallbackProvider = providerRegistry.resolve(fallback);
        result = await fallbackProvider.generateObject({ ...args, prompt: enrichedPrompt });
        usedFallback = true;
        usedProvider = fallback;
      } else {
        throw err;
      }
    }

    recordRun({
      provider: usedProvider,
      model: result.model,
      operation: "generateObject",
      routeDecision: route,
      confidence: result.confidence,
      fallbackUsed: usedFallback,
      sessionId: args.sessionId,
      taskId: args.taskId,
      projectId: args.projectId,
      workflowCode: args.workflowCode,
      stepCode: args.stepCode,
      actorType: args.actorType,
      actorId: args.actorId,
      promptSnapshot: args.prompt,
      retrievedContextRefs: contextBlockIds,
      parsedOutput: result.object,
      latencyMs: Date.now() - start,
    });

    return { ...result, fallbackUsed: usedFallback };
  }

  async classify<TLabel extends string>(
    args: GatewayClassifyArgs<TLabel>,
  ): Promise<ClassifyResult<TLabel>> {
    const context = args.routingContext ?? "intake_classification";
    const route = decideRoute(context);
    const provider = providerRegistry.resolve(route.selectedProvider);

    const start = Date.now();
    let result: ClassifyResult<TLabel>;
    let usedFallback = false;
    let usedProvider = route.selectedProvider;

    try {
      result = await provider.classify(args);

      if (needsFallback(result.confidence, "intent_classification") && !usedFallback) {
        const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
        if (fallback) {
          const fallbackProvider = providerRegistry.resolve(fallback);
          result = await fallbackProvider.classify(args);
          usedFallback = true;
          usedProvider = fallback;
        }
      }
    } catch (err) {
      const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
      if (fallback) {
        const fallbackProvider = providerRegistry.resolve(fallback);
        result = await fallbackProvider.classify(args);
        usedFallback = true;
        usedProvider = fallback;
      } else {
        throw err;
      }
    }

    recordRun({
      provider: usedProvider,
      model: result.model,
      operation: "classify",
      routeDecision: route,
      confidence: result.confidence,
      fallbackUsed: usedFallback,
      sessionId: args.sessionId,
      promptSnapshot: `Classify: ${args.prompt.slice(0, 500)}`,
      retrievedContextRefs: [],
      latencyMs: Date.now() - start,
    });

    return { ...result, fallbackUsed: usedFallback };
  }

  async embed(args: GatewayEmbedArgs): Promise<EmbedResult> {
    const route = decideRoute("embedding");
    const provider = providerRegistry.resolve(route.selectedProvider);

    const start = Date.now();
    let result: EmbedResult;
    let usedFallback = false;
    let usedProvider = route.selectedProvider;

    try {
      result = await provider.embed(args);
    } catch (err) {
      const fallback = resolveFallback(route.selectedProvider, route.fallbackChain);
      if (fallback) {
        const fallbackProvider = providerRegistry.resolve(fallback);
        result = await fallbackProvider.embed(args);
        usedFallback = true;
        usedProvider = fallback;
      } else {
        throw err;
      }
    }

    recordRun({
      provider: usedProvider,
      model: result.model,
      operation: "embed",
      routeDecision: route,
      confidence: 1.0,
      fallbackUsed: usedFallback,
      sessionId: args.sessionId,
      promptSnapshot: `Embed ${args.texts.length} texts`,
      retrievedContextRefs: [],
      latencyMs: Date.now() - start,
    });

    return result;
  }

  async rerank(args: GatewayRerankArgs): Promise<RerankResult> {
    const route = decideRoute("reranking");
    const provider = providerRegistry.resolve(route.selectedProvider);

    const start = Date.now();
    const result = await provider.rerank(args);

    recordRun({
      provider: route.selectedProvider,
      model: result.model,
      operation: "rerank",
      routeDecision: route,
      confidence: 1.0,
      fallbackUsed: false,
      sessionId: args.sessionId,
      promptSnapshot: `Rerank query: ${args.query.slice(0, 200)}`,
      retrievedContextRefs: [],
      latencyMs: Date.now() - start,
    });

    return result;
  }
}

/** Singleton gateway instance */
export const aiGateway = new AiGateway();
