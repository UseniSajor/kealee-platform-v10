// ============================================================
// JURISDICTION TRAINING SERVICE
// Train AI models per jurisdiction
// ============================================================

import { LearningFeedbackService } from './learning-feedback';
import { 
  JurisdictionAIConfig, 
  ModelTrainingData,
  AIEngineConfig
} from '../types';

export class JurisdictionTrainingService {
  private feedbackService: LearningFeedbackService;
  private trainedModels: Map<string, {
    jurisdictionId: string;
    permitType: string;
    modelVersion: string;
    accuracy: number;
    trainedAt: Date;
  }> = new Map();

  constructor(feedbackService: LearningFeedbackService) {
    this.feedbackService = feedbackService;
  }

  /**
   * Check if jurisdiction has enough training data
   */
  hasEnoughTrainingData(
    jurisdictionId: string,
    permitType: string,
    minimumSamples: number = 50
  ): boolean {
    const trainingData = this.feedbackService.getTrainingData(jurisdictionId, permitType);
    return trainingData.length >= minimumSamples;
  }

  /**
   * Train model for specific jurisdiction and permit type
   */
  async trainModel(
    jurisdictionId: string,
    permitType: string,
    config?: {
      modelType?: 'fine-tune' | 'few-shot' | 'custom';
      hyperparameters?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    modelVersion?: string;
    accuracy?: number;
    error?: string;
  }> {
    try {
      // Check if enough training data
      if (!this.hasEnoughTrainingData(jurisdictionId, permitType)) {
        return {
          success: false,
          error: 'Insufficient training data. Need at least 50 samples.'
        };
      }

      // Get training data
      const trainingData = this.feedbackService.getTrainingData(jurisdictionId, permitType);
      
      // Calculate current accuracy
      const accuracy = this.feedbackService.calculateAccuracy(jurisdictionId, permitType).accuracy;

      // In a real implementation, this would:
      // 1. Prepare training data in model-specific format
      // 2. Fine-tune or train custom model
      // 3. Validate model performance
      // 4. Deploy model version
      
      // For now, simulate training
      const modelVersion = `v1.${Date.now()}`;
      
      this.trainedModels.set(`${jurisdictionId}-${permitType}`, {
        jurisdictionId,
        permitType,
        modelVersion,
        accuracy,
        trainedAt: new Date()
      });

      return {
        success: true,
        modelVersion,
        accuracy
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Training failed'
      };
    }
  }

  /**
   * Get trained model info
   */
  getTrainedModel(
    jurisdictionId: string,
    permitType: string
  ): {
    jurisdictionId: string;
    permitType: string;
    modelVersion: string;
    accuracy: number;
    trainedAt: Date;
  } | null {
    const key = `${jurisdictionId}-${permitType}`;
    const model = this.trainedModels.get(key);
    return model || null;
  }

  /**
   * Get training statistics
   */
  getTrainingStats(
    jurisdictionId: string,
    permitType?: string
  ): {
    totalSamples: number;
    accuracy: number;
    lastTrained?: Date;
    modelVersion?: string;
    errorPatterns: Array<{
      pattern: string;
      frequency: number;
    }>;
  } {
    const accuracy = this.feedbackService.calculateAccuracy(jurisdictionId, permitType);
    const errorPatterns = this.feedbackService.getErrorPatterns(jurisdictionId);
    const model = permitType 
      ? this.getTrainedModel(jurisdictionId, permitType)
      : null;

    return {
      totalSamples: accuracy.totalReviews,
      accuracy: accuracy.accuracy,
      lastTrained: model?.trainedAt,
      modelVersion: model?.modelVersion,
      errorPatterns: errorPatterns.map(ep => ({
        pattern: ep.pattern,
        frequency: ep.frequency
      }))
    };
  }

  /**
   * Update jurisdiction AI config with trained model preferences
   */
  updateConfigWithTrainedModels(
    config: JurisdictionAIConfig
  ): JurisdictionAIConfig {
    const updated = { ...config };

    // Get all trained models for this jurisdiction
    const models = Array.from(this.trainedModels.values())
      .filter(m => m.jurisdictionId === config.jurisdictionId);

    if (models.length > 0 && !updated.modelPreferences) {
      updated.modelPreferences = {};
    }

    models.forEach(model => {
      if (updated.modelPreferences) {
        // Set custom model for this permit type
        updated.modelPreferences.planAnalysis = model.modelVersion;
      }
    });

    return updated;
  }

  /**
   * Schedule automatic retraining
   */
  scheduleRetraining(
    jurisdictionId: string,
    permitType: string,
    intervalDays: number = 30
  ): void {
    // In a real implementation, this would set up a cron job or scheduled task
    // to automatically retrain models when new feedback data is available
    console.log(`Scheduled retraining for ${jurisdictionId}-${permitType} every ${intervalDays} days`);
  }

  /**
   * Export model for deployment
   */
  exportModel(
    jurisdictionId: string,
    permitType: string
  ): {
    success: boolean;
    modelData?: any;
    error?: string;
  } {
    const model = this.getTrainedModel(jurisdictionId, permitType);
    
    if (!model) {
      return {
        success: false,
        error: 'Model not found'
      };
    }

    // In a real implementation, this would export the actual model weights/config
    return {
      success: true,
      modelData: {
        jurisdictionId: model.jurisdictionId,
        permitType: model.permitType,
        modelVersion: model.modelVersion,
        accuracy: model.accuracy,
        trainedAt: model.trainedAt
      }
    };
  }
}
