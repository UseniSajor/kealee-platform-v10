// ============================================================
// AI REVIEW SERVICE
// Main service orchestrating all AI engines for permit review
// ============================================================

import { VisionEngine, DimensionExtractor, ElementDetector } from '../engines/plan-analysis';
import { PDFProcessor, OCREngine, MetadataExtractor } from '../engines/document-intelligence';
import { ComplianceChecker } from '../engines/code-compliance';
import { CorrectionParser, FormUnderstanding, ReportGenerator } from '../engines/nlp';
import {
  AIResult,
  ReviewRequest,
  ReviewResult,
  PlanImage,
  AIEngineConfig,
  JurisdictionAIConfig,
  PerformanceMetrics
} from '../types';

export class AIReviewService {
  private visionEngine: VisionEngine;
  private dimensionExtractor: DimensionExtractor;
  private elementDetector: ElementDetector;
  private pdfProcessor: PDFProcessor;
  private ocrEngine: OCREngine;
  private metadataExtractor: MetadataExtractor;
  private complianceChecker: ComplianceChecker;
  private correctionParser: CorrectionParser;
  private formUnderstanding: FormUnderstanding;
  private reportGenerator: ReportGenerator;
  
  private jurisdictionConfigs: Map<string, JurisdictionAIConfig> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor(config: {
    openaiApiKey: string;
    jurisdictionConfigs?: JurisdictionAIConfig[];
  }) {
    // Initialize engines
    const engineConfig: AIEngineConfig = {
      provider: 'openai',
      apiKey: config.openaiApiKey,
      model: 'gpt-4-vision-preview'
    };

    this.visionEngine = new VisionEngine(engineConfig);
    this.dimensionExtractor = new DimensionExtractor(this.visionEngine);
    this.elementDetector = new ElementDetector(this.visionEngine);
    
    this.pdfProcessor = new PDFProcessor();
    this.ocrEngine = new OCREngine();
    this.metadataExtractor = new MetadataExtractor(config.openaiApiKey);
    
    this.complianceChecker = new ComplianceChecker(config.openaiApiKey);
    
    this.correctionParser = new CorrectionParser(config.openaiApiKey);
    this.formUnderstanding = new FormUnderstanding(config.openaiApiKey);
    this.reportGenerator = new ReportGenerator(config.openaiApiKey);

    // Load jurisdiction configs
    if (config.jurisdictionConfigs) {
      config.jurisdictionConfigs.forEach(jc => {
        this.jurisdictionConfigs.set(jc.jurisdictionId, jc);
      });
    }
  }

  /**
   * Perform comprehensive AI review of permit application
   */
  async reviewPermit(request: ReviewRequest): Promise<AIResult<ReviewResult>> {
    const startTime = Date.now();
    const requestId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get jurisdiction-specific config
      const jurisdictionConfig = this.jurisdictionConfigs.get(request.jurisdictionId);
      
      // 1. Analyze plans if provided
      let planAnalysis = null;
      if (request.plans && request.plans.length > 0) {
        const planResult = await this.analyzePlans(request.plans, jurisdictionConfig);
        if (planResult.success) {
          planAnalysis = planResult.data;
        }
      }

      // 2. Process documents
      const documentResults = await this.processDocuments(
        request.documents || [],
        jurisdictionConfig
      );

      // 3. Check code compliance
      let complianceResult = null;
      if (planAnalysis) {
        const compliance = await this.complianceChecker.checkCompliance(
          planAnalysis,
          {
            permitType: request.permitType,
            projectData: request.projectData,
            jurisdictionId: request.jurisdictionId
          }
        );
        if (compliance.success) {
          complianceResult = compliance.data;
        }
      }

      // 4. Identify missing documents
      const missingDocuments = this.identifyMissingDocuments(
        request.documents || [],
        request.permitType,
        jurisdictionConfig
      );

      // 5. Compile issues
      const planIssues = planAnalysis?.issues || [];
      const codeViolations = complianceResult?.checks.filter(c => c.status === 'fail') || [];
      
      // 6. Generate suggested fixes
      const suggestedFixes = this.generateSuggestedFixes(
        planIssues,
        codeViolations,
        missingDocuments
      );

      // 7. Calculate overall score
      const overallScore = this.calculateScore(
        planIssues,
        codeViolations,
        missingDocuments.length
      );

      // 8. Determine if ready to submit
      const readyToSubmit = overallScore >= 75 && 
                           planIssues.filter(i => i.severity === 'critical').length === 0 &&
                           missingDocuments.length === 0;

      const processingTime = Date.now() - startTime;

      // Track performance
      this.trackPerformance({
        requestId,
        engine: 'ai-review-service',
        jurisdictionId: request.jurisdictionId,
        processingTimeMs: processingTime,
        confidence: this.calculateOverallConfidence(planAnalysis, complianceResult),
        success: true,
        timestamp: new Date()
      });

      const result: ReviewResult = {
        permitId: request.permitId,
        overallScore,
        readyToSubmit,
        planIssues,
        codeViolations,
        missingDocuments,
        suggestedFixes,
        confidence: this.calculateOverallConfidence(planAnalysis, complianceResult),
        processingTimeMs: processingTime,
        modelVersion: '1.0.0',
        reviewedAt: new Date()
      };

      return {
        success: true,
        data: result,
        confidence: result.confidence,
        processingTimeMs: processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.trackPerformance({
        requestId,
        engine: 'ai-review-service',
        jurisdictionId: request.jurisdictionId,
        processingTimeMs: processingTime,
        confidence: 0,
        success: false,
        errorType: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date()
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Review failed',
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Analyze plans
   */
  private async analyzePlans(
    images: PlanImage[],
    jurisdictionConfig?: JurisdictionAIConfig
  ): Promise<AIResult<any>> {
    return this.visionEngine.analyzePlans(images);
  }

  /**
   * Process documents
   */
  private async processDocuments(
    documents: Array<{ url: string; type: string }>,
    jurisdictionConfig?: JurisdictionAIConfig
  ): Promise<Array<AIResult<any>>> {
    const results = await Promise.all(
      documents.map(doc => this.metadataExtractor.extractAll(doc.url))
    );
    return results;
  }

  /**
   * Identify missing required documents
   */
  private identifyMissingDocuments(
    providedDocuments: Array<{ url: string; type: string }>,
    permitType: string,
    jurisdictionConfig?: JurisdictionAIConfig
  ): string[] {
    // Default required documents by permit type
    const defaultRequired: Record<string, string[]> = {
      BUILDING: ['site_plan', 'floor_plan', 'elevation', 'structural_calcs'],
      ELECTRICAL: ['electrical_diagram', 'load_calc'],
      PLUMBING: ['plumbing_diagram', 'fixture_schedule'],
      MECHANICAL: ['mechanical_diagram', 'hvac_calc']
    };

    const required = jurisdictionConfig?.formSchemas?.find(
      fs => fs.permitType === permitType
    )?.fields.filter(f => f.type === 'file').map(f => f.name) ||
    defaultRequired[permitType] ||
    [];

    const providedTypes = providedDocuments.map(d => d.type.toLowerCase());
    const missing = required.filter(req => 
      !providedTypes.some(prov => prov.includes(req.toLowerCase()))
    );

    return missing;
  }

  /**
   * Generate suggested fixes
   */
  private generateSuggestedFixes(
    planIssues: any[],
    codeViolations: any[],
    missingDocuments: string[]
  ): Array<{ issue: string; fix: string; priority: 'high' | 'medium' | 'low' }> {
    const fixes: Array<{ issue: string; fix: string; priority: 'high' | 'medium' | 'low' }> = [];

    // Add fixes from plan issues
    planIssues.forEach((issue: any) => {
      if (issue.suggestedFix) {
        fixes.push({
          issue: issue.description,
          fix: issue.suggestedFix,
          priority: issue.severity === 'critical' ? 'high' : 
                   issue.severity === 'major' ? 'medium' : 'low'
        });
      }
    });

    // Add fixes from code violations
    codeViolations.forEach(violation => {
      if (violation.suggestedFix) {
        fixes.push({
          issue: violation.message,
          fix: violation.suggestedFix,
          priority: violation.rule.category === 'structural' ? 'high' : 'medium'
        });
      }
    });

    // Add missing document fixes
    if (missingDocuments.length > 0) {
      fixes.push({
        issue: 'Missing required documents',
        fix: `Upload the following documents: ${missingDocuments.join(', ')}`,
        priority: 'high'
      });
    }

    return fixes;
  }

  /**
   * Calculate overall score (0-100)
   */
  private calculateScore(
    planIssues: any[],
    codeViolations: any[],
    missingDocCount: number
  ): number {
    let score = 100;

    // Deduct for critical issues
    const criticalIssues = planIssues.filter(i => i.severity === 'critical');
    score -= criticalIssues.length * 20;

    // Deduct for major issues
    const majorIssues = planIssues.filter(i => i.severity === 'major');
    score -= majorIssues.length * 10;

    // Deduct for minor issues
    const minorIssues = planIssues.filter(i => i.severity === 'minor');
    score -= minorIssues.length * 5;

    // Deduct for code violations
    score -= codeViolations.length * 15;

    // Deduct for missing documents
    score -= missingDocCount * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    planAnalysis: any,
    complianceResult: any
  ): number {
    const confidences: number[] = [];

    if (planAnalysis) {
      // Would get confidence from plan analysis
      confidences.push(0.8);
    }

    if (complianceResult) {
      // Would get confidence from compliance check
      confidences.push(0.85);
    }

    return confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.7;
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): PerformanceMetrics[] {
    let filtered = this.performanceMetrics;

    if (jurisdictionId) {
      filtered = filtered.filter(m => m.jurisdictionId === jurisdictionId);
    }

    if (startDate) {
      filtered = filtered.filter(m => m.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(m => m.timestamp <= endDate);
    }

    return filtered;
  }

  /**
   * Update jurisdiction configuration
   */
  updateJurisdictionConfig(config: JurisdictionAIConfig): void {
    this.jurisdictionConfigs.set(config.jurisdictionId, config);
  }

  /**
   * Get jurisdiction configuration
   */
  getJurisdictionConfig(jurisdictionId: string): JurisdictionAIConfig | undefined {
    return this.jurisdictionConfigs.get(jurisdictionId);
  }
}
