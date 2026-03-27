/**
 * Assembly Suggester
 * AI-powered assembly recommendations
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';

const prisma = new PrismaClient();

export interface AssemblySuggestion {
  id: string;
  assemblyId: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  matchScore: number;
  matchReasons: string[];
  estimatedCost: number;
  unit: string;
  suggestedQuantity?: number;
  alternatives: AlternativeSuggestion[];
}

export interface AlternativeSuggestion {
  assemblyId: string;
  name: string;
  cost: number;
  costDifference: number;
  tradeoffs: string[];
}

export interface SuggestionContext {
  projectType?: string;
  buildingType?: string;
  region?: string;
  quality?: 'ECONOMY' | 'STANDARD' | 'PREMIUM';
  keywords?: string[];
  existingAssemblies?: string[];
  budget?: number;
}

export interface SuggestionResult {
  suggestions: AssemblySuggestion[];
  context: SuggestionContext;
  totalSuggested: number;
  estimatedCost: number;
}

export class AssemblySuggester {
  /**
   * Suggest assemblies for estimate
   */
  async suggestAssemblies(
    estimateId: string,
    context: SuggestionContext
  ): Promise<SuggestionResult> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: { lineItems: true },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Get existing assembly IDs
    const existingAssemblyIds = new Set(
      estimate.sections.flatMap(s =>
        s.lineItems
          .filter(i => i.assemblyId)
          .map(i => i.assemblyId!)
      )
    );

    context.existingAssemblies = Array.from(existingAssemblyIds);

    // Get available assemblies from database
    // Assembly belongs to costDatabase, not organization directly
    // First get the cost databases for this organization
    const costDatabases = await prisma.costDatabase.findMany({
      where: { organizationId: estimate.organizationId },
      select: { id: true },
    });
    const costDatabaseIds = costDatabases.map(db => db.id);

    const assemblies = await prisma.assembly.findMany({
      where: {
        costDatabaseId: { in: costDatabaseIds },
        isActive: true,
      },
      take: 500,
    });

    // Score and rank assemblies
    const suggestions: AssemblySuggestion[] = [];
    let totalEstimatedCost = 0;

    for (const assembly of assemblies) {
      // Skip already used assemblies
      if (existingAssemblyIds.has(assembly.id)) continue;

      const score = this.calculateMatchScore(assembly, context, estimate);

      if (score > 0.3) {
        const alternatives = await this.findAlternatives(assembly, assemblies);

        // Assembly uses 'csiCode' not 'code', 'unitCost' not 'totalCost'
        const suggestion: AssemblySuggestion = {
          id: uuid(),
          assemblyId: assembly.id,
          code: assembly.csiCode || '',
          name: assembly.name,
          description: assembly.description || undefined,
          category: assembly.category,
          matchScore: score,
          matchReasons: this.getMatchReasons(assembly, context, estimate),
          estimatedCost: Number(assembly.unitCost) || 0,
          unit: assembly.unit,
          suggestedQuantity: this.estimateQuantity(assembly, estimate),
          alternatives,
        };

        suggestions.push(suggestion);
        totalEstimatedCost += suggestion.estimatedCost * (suggestion.suggestedQuantity || 1);
      }
    }

    // Sort by match score
    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    const limitedSuggestions = suggestions.slice(0, 20);

    return {
      suggestions: limitedSuggestions,
      context,
      totalSuggested: limitedSuggestions.length,
      estimatedCost: totalEstimatedCost,
    };
  }

  /**
   * Suggest assemblies for scope item
   */
  async suggestForScopeItem(
    scopeDescription: string,
    options?: {
      organizationId?: string;
      databaseId?: string;
      limit?: number;
      qualityLevel?: 'ECONOMY' | 'STANDARD' | 'PREMIUM';
    }
  ): Promise<AssemblySuggestion[]> {
    // Parse scope description for keywords
    const keywords = this.extractKeywords(scopeDescription);

    // Search assemblies
    const whereClause: any = {
      isActive: true,
      OR: [
        { name: { contains: keywords[0], mode: 'insensitive' } },
        { description: { contains: keywords[0], mode: 'insensitive' } },
        ...(keywords.length > 1
          ? keywords.slice(1).map(k => ({
              OR: [
                { name: { contains: k, mode: 'insensitive' } },
                { description: { contains: k, mode: 'insensitive' } },
              ],
            }))
          : []),
      ],
    };

    // Assembly uses costDatabaseId, not organizationId or databaseId directly
    if (options?.organizationId) {
      // Get cost databases for this organization
      const costDatabases = await prisma.costDatabase.findMany({
        where: { organizationId: options.organizationId },
        select: { id: true },
      });
      whereClause.costDatabaseId = { in: costDatabases.map(db => db.id) };
    }
    if (options?.databaseId) {
      whereClause.costDatabaseId = options.databaseId;
    }

    const assemblies = await prisma.assembly.findMany({
      where: whereClause,
      take: options?.limit || 10,
      orderBy: { name: 'asc' },
    });

    // Assembly uses 'csiCode' not 'code', 'unitCost' not 'totalCost'
    return assemblies.map(assembly => ({
      id: uuid(),
      assemblyId: assembly.id,
      code: assembly.csiCode || '',
      name: assembly.name,
      description: assembly.description || undefined,
      category: assembly.category,
      matchScore: this.calculateKeywordMatchScore(assembly, keywords),
      matchReasons: keywords.filter(k =>
        assembly.name.toLowerCase().includes(k.toLowerCase()) ||
        (assembly.description?.toLowerCase() || '').includes(k.toLowerCase())
      ).map(k => `Matches keyword "${k}"`),
      estimatedCost: Number(assembly.unitCost) || 0,
      unit: assembly.unit,
      alternatives: [],
    }));
  }

  /**
   * Suggest complementary assemblies
   */
  async suggestComplementary(
    assemblyId: string,
    organizationId: string
  ): Promise<AssemblySuggestion[]> {
    const assembly = await prisma.assembly.findUnique({
      where: { id: assemblyId },
    });

    if (!assembly) {
      throw new Error('Assembly not found');
    }

    // Find assemblies commonly used together
    const relatedEstimates = await prisma.estimateLineItem.findMany({
      where: {
        assemblyId,
        estimate: { organizationId },
      },
      select: {
        estimateId: true,
      },
      take: 50,
    });

    const estimateIds = relatedEstimates.map(e => e.estimateId);

    if (estimateIds.length === 0) {
      return [];
    }

    // Get other assemblies used in those estimates
    const coUsedItems = await prisma.estimateLineItem.groupBy({
      by: ['assemblyId'],
      where: {
        estimateId: { in: estimateIds },
        assemblyId: { not: assemblyId },
      },
      _count: { assemblyId: true },
      orderBy: { _count: { assemblyId: 'desc' } },
      take: 10,
    });

    const assemblyIds = coUsedItems
      .filter(i => i.assemblyId)
      .map(i => i.assemblyId!);

    if (assemblyIds.length === 0) {
      return [];
    }

    const complementaryAssemblies = await prisma.assembly.findMany({
      where: { id: { in: assemblyIds } },
    });

    // Assembly uses 'csiCode' not 'code', 'unitCost' not 'totalCost'
    return complementaryAssemblies.map((comp, index) => ({
      id: uuid(),
      assemblyId: comp.id,
      code: comp.csiCode || '',
      name: comp.name,
      description: comp.description || undefined,
      category: comp.category,
      matchScore: 1 - index * 0.1,
      matchReasons: [`Commonly used with ${assembly.name}`],
      estimatedCost: Number(comp.unitCost) || 0,
      unit: comp.unit,
      alternatives: [],
    }));
  }

  /**
   * Auto-populate estimate from scope
   */
  async autoPopulateEstimate(
    estimateId: string,
    scopeItems: { description: string; quantity?: number }[]
  ): Promise<{
    added: { code: string; name: string; quantity: number; cost: number }[];
    unmatched: string[];
    totalCost: number;
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const added: { code: string; name: string; quantity: number; cost: number }[] = [];
    const unmatched: string[] = [];
    let totalCost = 0;

    for (const scopeItem of scopeItems) {
      const suggestions = await this.suggestForScopeItem(scopeItem.description, {
        organizationId: estimate.organizationId,
        limit: 1,
      });

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        const quantity = scopeItem.quantity || 1;
        const cost = suggestion.estimatedCost * quantity;

        // Get or create appropriate section - use csiCode not code
        let section = await prisma.estimateSection.findFirst({
          where: {
            estimateId,
            csiCode: { startsWith: suggestion.category.substring(0, 2) },
          },
        });

        if (!section) {
          section = await prisma.estimateSection.create({
            data: {
              id: uuid(),
              estimate: { connect: { id: estimateId } },
              csiCode: suggestion.category.substring(0, 2),
              name: suggestion.category,
              sortOrder: 100,
            },
          });
        }

        // Add line item - use csiCode not code
        await prisma.estimateLineItem.create({
          data: {
            id: uuid(),
            estimate: { connect: { id: estimateId } },
            section: { connect: { id: section.id } },
            csiCode: suggestion.code,
            name: suggestion.name,
            description: scopeItem.description,
            quantity,
            unit: suggestion.unit,
            unitCost: suggestion.estimatedCost,
            totalCost: cost,
            materialCost: cost * 0.5, // Estimate material portion
            laborCost: cost * 0.4,
            equipmentCost: cost * 0.1,
            sortOrder: 100,
            assembly: suggestion.assemblyId ? { connect: { id: suggestion.assemblyId } } : undefined,
            metadata: {
              autoPopulated: true,
              originalScope: scopeItem.description,
              matchScore: suggestion.matchScore,
            },
          } as any,
        });

        added.push({
          code: suggestion.code,
          name: suggestion.name,
          quantity,
          cost,
        });
        totalCost += cost;
      } else {
        unmatched.push(scopeItem.description);
      }
    }

    return { added, unmatched, totalCost };
  }

  /**
   * Calculate match score
   */
  private calculateMatchScore(
    assembly: any,
    context: SuggestionContext,
    estimate: any
  ): number {
    let score = 0.5; // Base score

    // Keyword matching
    if (context.keywords) {
      const matchedKeywords = context.keywords.filter(k =>
        assembly.name.toLowerCase().includes(k.toLowerCase()) ||
        (assembly.description?.toLowerCase() || '').includes(k.toLowerCase())
      );
      score += matchedKeywords.length * 0.1;
    }

    // Category relevance
    const estimateCategories = new Set(
      estimate.sections.map((s: any) => s.csiCode?.substring(0, 2))
    );
    if (estimateCategories.has(assembly.category.substring(0, 2))) {
      score += 0.2;
    }

    // Quality level matching
    if (context.quality) {
      const cost = Number(assembly.totalCost) || 0;
      const avgCost = 1000; // Placeholder average

      if (context.quality === 'ECONOMY' && cost < avgCost * 0.8) score += 0.1;
      if (context.quality === 'PREMIUM' && cost > avgCost * 1.2) score += 0.1;
      if (context.quality === 'STANDARD' && cost >= avgCost * 0.8 && cost <= avgCost * 1.2) score += 0.1;
    }

    // Budget fit
    if (context.budget) {
      const cost = Number(assembly.totalCost) || 0;
      if (cost <= context.budget * 0.1) score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Get match reasons
   */
  private getMatchReasons(
    assembly: any,
    context: SuggestionContext,
    estimate: any
  ): string[] {
    const reasons: string[] = [];

    if (context.keywords) {
      const matchedKeywords = context.keywords.filter(k =>
        assembly.name.toLowerCase().includes(k.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        reasons.push(`Matches keywords: ${matchedKeywords.join(', ')}`);
      }
    }

    const estimateCategories = new Set(
      estimate.sections.map((s: any) => s.csiCode?.substring(0, 2))
    );
    if (estimateCategories.has(assembly.category.substring(0, 2))) {
      reasons.push('Related category already in estimate');
    }

    if (reasons.length === 0) {
      reasons.push('General match based on project type');
    }

    return reasons;
  }

  /**
   * Find alternatives
   */
  private async findAlternatives(
    assembly: any,
    allAssemblies: any[]
  ): Promise<AlternativeSuggestion[]> {
    const alternatives: AlternativeSuggestion[] = [];
    const baseCost = Number(assembly.totalCost) || 0;

    // Find similar assemblies in same category
    const similar = allAssemblies.filter(a =>
      a.id !== assembly.id &&
      a.category === assembly.category &&
      a.unit === assembly.unit
    );

    for (const alt of similar.slice(0, 3)) {
      const altCost = Number(alt.totalCost) || 0;
      const costDifference = altCost - baseCost;

      alternatives.push({
        assemblyId: alt.id,
        name: alt.name,
        cost: altCost,
        costDifference,
        tradeoffs: this.getTradeoffs(assembly, alt, costDifference),
      });
    }

    return alternatives.sort((a, b) => Math.abs(a.costDifference) - Math.abs(b.costDifference));
  }

  /**
   * Get tradeoffs between assemblies
   */
  private getTradeoffs(original: any, alternative: any, costDifference: number): string[] {
    const tradeoffs: string[] = [];

    if (costDifference > 0) {
      tradeoffs.push('Higher cost');
      tradeoffs.push('May offer better quality or features');
    } else if (costDifference < 0) {
      tradeoffs.push('Lower cost');
      tradeoffs.push('May have reduced scope or quality');
    }

    return tradeoffs;
  }

  /**
   * Estimate quantity
   */
  private estimateQuantity(assembly: any, estimate: any): number | undefined {
    // Look at similar items in estimate to suggest quantity
    for (const section of estimate.sections) {
      for (const item of section.lineItems) {
        if (item.unit === assembly.unit) {
          return Number(item.quantity) || undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'get', 'got', 'getting', 'including', 'include', 'includes',
    ]);

    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    return Array.from(new Set(words)).slice(0, 5);
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatchScore(assembly: any, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    const text = `${assembly.name} ${assembly.description || ''}`.toLowerCase();
    const matches = keywords.filter(k => text.includes(k.toLowerCase()));

    return matches.length / keywords.length;
  }
}

export const assemblySuggester = new AssemblySuggester();
