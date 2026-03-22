/**
 * Concept Engine Queue
 * Handles: generate_floorplan, generate_concept_package, create_architect_review_task
 */

import { BaseQueue } from './base.queue';

export interface ConceptEngineJobData {
  jobType:     'generate_floorplan' | 'generate_concept_package' | 'create_architect_review_task';
  intakeId:    string;
  floorplanId?:string;
  projectPath: string;
  twinId?:     string;
  projectId?:  string;
  captureSessionId?: string;
  // For generate_concept_package
  intake?: Record<string, unknown>;
  svgUrl?: string;
  // For create_architect_review_task
  conceptPackageId?:  string;
  assignedArchitect?: string;
  notes?:             string;
}

export class ConceptEngineQueue extends BaseQueue<ConceptEngineJobData> {
  constructor() {
    super('concept-engine', {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail:     { age: 30 * 24 * 3600 },
      },
    });
  }

  async generateFloorplan(data: Omit<ConceptEngineJobData, 'jobType'>) {
    return this.add('generate_floorplan', { ...data, jobType: 'generate_floorplan' }, { priority: 1 });
  }

  async generateConceptPackage(data: Omit<ConceptEngineJobData, 'jobType'>) {
    return this.add('generate_concept_package', { ...data, jobType: 'generate_concept_package' }, { priority: 1 });
  }

  async createArchitectReviewTask(data: Omit<ConceptEngineJobData, 'jobType'>) {
    return this.add('create_architect_review_task', { ...data, jobType: 'create_architect_review_task' }, { priority: 2 });
  }
}

export const conceptEngineQueue = new ConceptEngineQueue();
