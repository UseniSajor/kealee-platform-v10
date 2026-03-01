/**
 * ML job data types for Claude API processing
 */

export type MLJobType =
  | 'analyze_text'
  | 'generate_recommendation'
  | 'classify_content'
  | 'extract_insights'
  | 'summarize'
  | 'custom'

export interface MLJobData {
  type: MLJobType
  prompt: string
  systemPrompt?: string
  model?: string // Claude model version (default: claude-sonnet-4-20250514)
  maxTokens?: number
  temperature?: number
  metadata?: {
    userId?: string
    orgId?: string
    projectId?: string
    eventType?: string
    context?: Record<string, any>
    [key: string]: any
  }
}

export interface MLJobResult {
  success: boolean
  content?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  error?: string
  model?: string
  processedAt?: Date
}

/**
 * Common ML job templates
 */
export const ML_JOB_TEMPLATES = {
  analyzeText: (text: string, analysisType: string): MLJobData => ({
    type: 'analyze_text',
    prompt: `Analyze the following text and provide ${analysisType}:\n\n${text}`,
    systemPrompt: 'You are a helpful assistant that analyzes text and provides insights.',
  }),

  generateRecommendation: (context: string, recommendationType: string): MLJobData => ({
    type: 'generate_recommendation',
    prompt: `Based on the following context, generate ${recommendationType} recommendations:\n\n${context}`,
    systemPrompt: 'You are a helpful assistant that provides actionable recommendations.',
  }),

  classifyContent: (content: string, categories: string[]): MLJobData => ({
    type: 'classify_content',
    prompt: `Classify the following content into one of these categories: ${categories.join(', ')}\n\nContent: ${content}`,
    systemPrompt: 'You are a helpful assistant that classifies content accurately.',
  }),

  extractInsights: (data: string, insightType: string): MLJobData => ({
    type: 'extract_insights',
    prompt: `Extract ${insightType} insights from the following data:\n\n${data}`,
    systemPrompt: 'You are a helpful assistant that extracts meaningful insights from data.',
  }),

  summarize: (text: string, summaryLength: 'short' | 'medium' | 'long' = 'medium'): MLJobData => ({
    type: 'summarize',
    prompt: `Summarize the following text in a ${summaryLength} summary:\n\n${text}`,
    systemPrompt: 'You are a helpful assistant that creates clear and concise summaries.',
  }),
}
