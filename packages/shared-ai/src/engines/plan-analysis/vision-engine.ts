// ============================================================
// PLAN ANALYSIS - VISION ENGINE
// GPT-4 Vision + Custom Models for Plan Analysis
// ============================================================

import OpenAI from 'openai';
import { AIEngineConfig, AIResult, PlanImage, PlanAnalysisResult, PlanIssue } from '../../types';

export class VisionEngine {
  private openai: OpenAI | null = null;
  private config: AIEngineConfig;
  private fallbackEnabled: boolean = true;

  constructor(config: AIEngineConfig) {
    this.config = config;
    
    if (config.provider === 'openai' || config.provider === 'hybrid') {
      if (!config.apiKey) {
        throw new Error('OpenAI API key required for vision engine');
      }
      this.openai = new OpenAI({ apiKey: config.apiKey });
    }
  }

  /**
   * Analyze plan images using GPT-4 Vision
   */
  async analyzePlans(
    images: PlanImage[],
    prompt?: string
  ): Promise<AIResult<PlanAnalysisResult>> {
    const startTime = Date.now();

    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const defaultPrompt = `Analyze these architectural/construction plans and extract:
1. All dimensions (with units)
2. Room labels and areas
3. Structural elements (walls, doors, windows, stairs)
4. Code compliance issues
5. Missing information
6. Annotations and notes

Return a structured JSON response with:
- dimensions: array of {value, unit, element, confidence, location}
- elements: array of {type, label, dimensions, location, confidence}
- rooms: array of {name, area, dimensions}
- annotations: array of text annotations
- issues: array of {severity, type, description, location, suggestedFix}`;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are an expert architectural plan reviewer. Analyze construction plans with precision and extract all relevant information in structured JSON format.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || defaultPrompt },
            ...images.map(img => ({
              type: 'image_url' as const,
              image_url: { url: img.url }
            }))
          ]
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4-vision-preview',
        messages,
        max_tokens: this.config.maxTokens || 4000,
        temperature: this.config.temperature || 0.1, // Low temperature for accuracy
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as PlanAnalysisResult;
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        confidence: this.calculateConfidence(result),
        processingTimeMs: processingTime,
        modelVersion: this.config.model || 'gpt-4-vision-preview'
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (this.fallbackEnabled) {
        return this.fallbackAnalysis(images, error as Error, processingTime);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Extract specific dimensions from plans
   */
  async extractDimensions(
    images: PlanImage[],
    targetElements?: string[]
  ): Promise<AIResult<PlanAnalysisResult['dimensions']>> {
    const prompt = targetElements
      ? `Extract dimensions for: ${targetElements.join(', ')}. Focus only on these elements.`
      : 'Extract all dimensions from these plans, including room dimensions, wall thicknesses, ceiling heights, and any other measurements.';

    const result = await this.analyzePlans(images, prompt);
    
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.dimensions
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Detect specific elements in plans
   */
  async detectElements(
    images: PlanImage[],
    elementTypes?: string[]
  ): Promise<AIResult<PlanAnalysisResult['elements']>> {
    const prompt = elementTypes
      ? `Detect and locate these elements: ${elementTypes.join(', ')}. For each element, provide type, label, location coordinates, and dimensions.`
      : 'Detect all structural and architectural elements including walls, doors, windows, rooms, stairs, fixtures, and annotations.';

    const result = await this.analyzePlans(images, prompt);
    
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.elements
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Check for code compliance issues in plans
   */
  async checkCodeCompliance(
    images: PlanImage[],
    codeReferences?: string[]
  ): Promise<AIResult<PlanIssue[]>> {
    const prompt = codeReferences
      ? `Check these plans for compliance with: ${codeReferences.join(', ')}. Identify any violations or potential issues.`
      : 'Check these plans for common building code compliance issues including egress requirements, accessibility, structural requirements, and fire safety.';

    const result = await this.analyzePlans(images, prompt);
    
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.issues || []
      };
    }

    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Calculate overall confidence score from analysis result
   */
  private calculateConfidence(result: PlanAnalysisResult): number {
    let totalConfidence = 0;
    let count = 0;

    // Average dimension confidences
    if (result.dimensions) {
      result.dimensions.forEach(dim => {
        totalConfidence += dim.confidence;
        count++;
      });
    }

    // Average element confidences
    if (result.elements) {
      result.elements.forEach(elem => {
        totalConfidence += elem.confidence;
        count++;
      });
    }

    return count > 0 ? totalConfidence / count : 0.5;
  }

  /**
   * Fallback analysis when primary engine fails
   */
  private async fallbackAnalysis(
    images: PlanImage[],
    error: Error,
    processingTime: number
  ): Promise<AIResult<PlanAnalysisResult>> {
    // Basic fallback - return minimal structure
    return {
      success: true,
      data: {
        dimensions: [],
        elements: [],
        issues: [{
          severity: 'info',
          type: 'missing_element',
          description: 'AI analysis unavailable. Manual review required.',
        }]
      },
      confidence: 0.3,
      processingTimeMs: processingTime,
      fallbackUsed: true,
      error: `Primary analysis failed: ${error.message}`
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.apiKey && (this.config.provider === 'openai' || this.config.provider === 'hybrid')) {
      this.openai = new OpenAI({ apiKey: config.apiKey });
    }
  }
}
