// ============================================================
// LEARNING FEEDBACK SERVICE
// Feedback loop for AI improvement
// ============================================================

import { 
  FeedbackData, 
  ModelTrainingData, 
  ReviewResult,
  PerformanceMetrics
} from '../types';

export class LearningFeedbackService {
  private feedbackData: FeedbackData[] = [];
  private trainingData: ModelTrainingData[] = [];

  /**
   * Record feedback on AI review
   */
  recordFeedback(feedback: FeedbackData): void {
    this.feedbackData.push(feedback);
    
    // Keep only last 10,000 feedback entries
    if (this.feedbackData.length > 10000) {
      this.feedbackData = this.feedbackData.slice(-10000);
    }
  }

  /**
   * Record training data from review
   */
  recordTrainingData(
    reviewResult: ReviewResult,
    actualOutcome: {
      wasCorrect: boolean;
      actualIssues?: string[];
      actualStatus?: 'approved' | 'rejected' | 'corrections_required';
    },
    jurisdictionId: string,
    permitType: string
  ): void {
    const trainingData: ModelTrainingData = {
      jurisdictionId,
      permitType,
      input: {
        permitId: reviewResult.permitId,
        overallScore: reviewResult.overallScore,
        planIssues: reviewResult.planIssues,
        codeViolations: reviewResult.codeViolations
      },
      expectedOutput: {
        wasCorrect: actualOutcome.wasCorrect,
        actualIssues: actualOutcome.actualIssues,
        actualStatus: actualOutcome.actualStatus
      },
      actualOutput: {
        readyToSubmit: reviewResult.readyToSubmit,
        overallScore: reviewResult.overallScore
      },
      feedback: {
        reviewId: `review-${reviewResult.permitId}`,
        permitId: reviewResult.permitId,
        jurisdictionId,
        source: actualOutcome.actualStatus === 'approved' ? 'jurisdiction_correction' : 'client_correction',
        feedback: {
          wasCorrect: actualOutcome.wasCorrect,
          actualOutcome: actualOutcome.actualStatus || 'unknown',
          notes: actualOutcome.wasCorrect ? 'AI prediction was accurate' : 'AI prediction needs improvement'
        },
        timestamp: new Date()
      }
    };

    this.trainingData.push(trainingData);
    
    // Keep only last 5,000 training examples
    if (this.trainingData.length > 5000) {
      this.trainingData = this.trainingData.slice(-5000);
    }
  }

  /**
   * Get feedback for analysis
   */
  getFeedback(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): FeedbackData[] {
    let filtered = this.feedbackData;

    if (jurisdictionId) {
      filtered = filtered.filter(f => f.jurisdictionId === jurisdictionId);
    }

    if (startDate) {
      filtered = filtered.filter(f => f.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(f => f.timestamp <= endDate);
    }

    return filtered;
  }

  /**
   * Get training data for model training
   */
  getTrainingData(
    jurisdictionId?: string,
    permitType?: string
  ): ModelTrainingData[] {
    let filtered = this.trainingData;

    if (jurisdictionId) {
      filtered = filtered.filter(td => td.jurisdictionId === jurisdictionId);
    }

    if (permitType) {
      filtered = filtered.filter(td => td.permitType === permitType);
    }

    return filtered;
  }

  /**
   * Calculate accuracy metrics
   */
  calculateAccuracy(
    jurisdictionId?: string,
    permitType?: string
  ): {
    totalReviews: number;
    correctPredictions: number;
    accuracy: number;
    falsePositives: number;
    falseNegatives: number;
  } {
    const trainingData = this.getTrainingData(jurisdictionId, permitType);
    
    const total = trainingData.length;
    const correct = trainingData.filter(td => 
      td.feedback?.feedback.wasCorrect
    ).length;
    
    const falsePositives = trainingData.filter(td => 
      !td.feedback?.feedback.wasCorrect &&
      td.actualOutput?.readyToSubmit === true &&
      td.expectedOutput?.actualStatus !== 'approved'
    ).length;

    const falseNegatives = trainingData.filter(td => 
      !td.feedback?.feedback.wasCorrect &&
      td.actualOutput?.readyToSubmit === false &&
      td.expectedOutput?.actualStatus === 'approved'
    ).length;

    return {
      totalReviews: total,
      correctPredictions: correct,
      accuracy: total > 0 ? correct / total : 0,
      falsePositives,
      falseNegatives
    };
  }

  /**
   * Get common error patterns
   */
  getErrorPatterns(
    jurisdictionId?: string
  ): Array<{
    pattern: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
  }> {
    const feedback = this.getFeedback(jurisdictionId);
    const incorrect = feedback.filter(f => !f.feedback.wasCorrect);

    // Group by issue type
    const patterns = new Map<string, number>();

    incorrect.forEach(f => {
      const issue = f.feedback.actualOutcome || 'unknown';
      patterns.set(issue, (patterns.get(issue) || 0) + 1);
    });

    return Array.from(patterns.entries())
      .map(([pattern, frequency]) => ({
        pattern,
        frequency,
        severity: frequency > 10 ? 'high' : frequency > 5 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Export training data for model training
   */
  exportTrainingData(
    jurisdictionId?: string,
    format: 'json' | 'csv' = 'json'
  ): string {
    const data = this.getTrainingData(jurisdictionId);

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = ['jurisdictionId', 'permitType', 'input', 'expectedOutput', 'actualOutput'];
    const rows = data.map(td => [
      td.jurisdictionId,
      td.permitType,
      JSON.stringify(td.input),
      JSON.stringify(td.expectedOutput),
      JSON.stringify(td.actualOutput)
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
