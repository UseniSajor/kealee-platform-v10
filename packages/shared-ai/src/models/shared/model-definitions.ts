// ============================================================
// SHARED MODEL DEFINITIONS
// Common model interfaces and utilities
// ============================================================

import { ModelTrainingData } from '../../types';

export type { ModelTrainingData };

export interface ModelConfig {
  id: string;
  name: string;
  type: 'vision' | 'nlp' | 'compliance' | 'hybrid';
  version: string;
  provider: 'openai' | 'custom' | 'hybrid';
  jurisdictionId?: string;
  permitType?: string;
  accuracy?: number;
  trainedAt?: Date;
  parameters?: Record<string, any>;
}

export interface ModelMetadata {
  modelId: string;
  version: string;
  trainingDataSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedAt: Date;
  deployedAt?: Date;
}

export interface TrainingConfig {
  modelType: string;
  hyperparameters: {
    learningRate?: number;
    batchSize?: number;
    epochs?: number;
    [key: string]: any;
  };
  validationSplit?: number;
  earlyStopping?: boolean;
}
