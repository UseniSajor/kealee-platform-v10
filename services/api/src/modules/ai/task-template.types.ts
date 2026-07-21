/**
 * Task Template Types
 * Types for AI-powered task generation from SOW documents
 */

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
  phase: string;
  mandatoryTasks: MandatoryTask[];
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface TaskGenerationRequest {
  sowText: string;
  projectType: string;
  projectId: string;
  phase?: string;
  includeDeliverables?: boolean;
  [key: string]: any;
}

export interface TaskGenerationResult {
  template: TaskTemplate;
  generatedAt: Date;
  confidence: number;
  reasoning: string;
  [key: string]: any;
}

export interface MandatoryTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  dependencies: string[];
  integrationPoints: Array<{
    module: string;
    action: string;
    required: boolean;
  }>;
  phase: string;
  complianceRequired: boolean;
  [key: string]: any;
}

export interface Deliverable {
  type: string;
  template?: string;
  trigger: string;
  taskId?: string;
  [key: string]: any;
}
