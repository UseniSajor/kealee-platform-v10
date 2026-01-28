/**
 * Base Agent Service
 *
 * Provides the foundation for all 7 specialized AI agents in the Kealee Platform.
 * Each agent handles specific construction operations tasks as defined in the
 * task-assignments module.
 */

import { prisma } from '../../lib/prisma';
import {
  AgentType,
  PackageTier,
  TaskCategory,
  AGENT_TASK_ASSIGNMENTS,
  PACKAGE_TASK_MAPPING,
  PLATFORM_TASKS,
  getTasksForAgent,
  getTasksForPackage,
  isTaskAvailable,
  type TaskDefinition,
  type AgentDefinition,
} from '@kealee/shared-integrations/src/agents/task-assignments';

// Agent execution status
export type AgentExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Agent execution input
export interface AgentExecutionInput {
  taskNumber: number;
  projectId?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

// Agent execution result
export interface AgentExecutionResult {
  success: boolean;
  executionId: string;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  tokensUsed?: number;
}

// Agent context passed to execution
export interface AgentContext {
  agentType: AgentType;
  task: TaskDefinition;
  organizationTier: PackageTier;
  userId?: string;
  projectId?: string;
}

/**
 * Base Agent Service
 * All specialized agents extend this base class
 */
export abstract class BaseAgentService {
  protected agentType: AgentType;
  protected agentDefinition: AgentDefinition;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
    this.agentDefinition = AGENT_TASK_ASSIGNMENTS[agentType];
  }

  /**
   * Get the agent's assigned tasks
   */
  getAssignedTasks(): TaskDefinition[] {
    return getTasksForAgent(this.agentType);
  }

  /**
   * Check if the agent can handle a specific task
   */
  canHandleTask(taskNumber: number): boolean {
    return this.agentDefinition.tasks.includes(taskNumber);
  }

  /**
   * Check if a task is available for an organization's package tier
   */
  isTaskAvailableForTier(taskNumber: number, tier: PackageTier): boolean {
    return isTaskAvailable(taskNumber, tier);
  }

  /**
   * Execute a task
   */
  async executeTask(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    let executionId: string = '';

    try {
      // Validate task assignment
      if (!this.canHandleTask(input.taskNumber)) {
        throw new Error(`Task ${input.taskNumber} is not assigned to ${this.agentType}`);
      }

      // Get task definition
      const task = PLATFORM_TASKS.find(t => t.taskNumber === input.taskNumber);
      if (!task) {
        throw new Error(`Task ${input.taskNumber} not found`);
      }

      // Create execution record
      const execution = await prisma.agentTaskExecution.create({
        data: {
          agentType: this.agentType,
          taskNumber: input.taskNumber,
          projectId: input.projectId,
          userId: input.userId,
          status: 'RUNNING',
          startedAt: new Date(),
          input: input.payload as any,
        },
      });
      executionId = execution.id;

      // Build context
      const context: AgentContext = {
        agentType: this.agentType,
        task,
        organizationTier: 'PROFESSIONAL', // Default, should be fetched from org
        userId: input.userId,
        projectId: input.projectId,
      };

      // Execute the task-specific logic
      const result = await this.executeTaskLogic(context, input.payload || {});

      // Calculate duration
      const durationMs = Date.now() - startTime;

      // Update execution record
      await prisma.agentTaskExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs,
          output: result as any,
          tokensUsed: (result as any)?.tokensUsed,
        },
      });

      return {
        success: true,
        executionId,
        output: result,
        durationMs,
        tokensUsed: (result as any)?.tokensUsed,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update execution record if we have one
      if (executionId) {
        await prisma.agentTaskExecution.update({
          where: { id: executionId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            durationMs,
            error: errorMessage,
          },
        });
      }

      return {
        success: false,
        executionId,
        error: errorMessage,
        durationMs,
      };
    }
  }

  /**
   * Abstract method to be implemented by each specialized agent
   */
  protected abstract executeTaskLogic(
    context: AgentContext,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>>;

  /**
   * Get agent configuration from database
   */
  async getConfig(): Promise<Record<string, unknown> | null> {
    const config = await prisma.agentConfig.findUnique({
      where: { agentType: this.agentType },
    });
    return config?.config as Record<string, unknown> | null;
  }

  /**
   * Update agent configuration
   */
  async updateConfig(config: Record<string, unknown>): Promise<void> {
    await prisma.agentConfig.upsert({
      where: { agentType: this.agentType },
      create: {
        agentType: this.agentType,
        name: this.agentDefinition.name,
        description: this.agentDefinition.description,
        assignedTasks: this.agentDefinition.tasks,
        config: config as any,
      },
      update: {
        config: config as any,
      },
    });
  }

  /**
   * Get execution history for this agent
   */
  async getExecutionHistory(options: {
    limit?: number;
    offset?: number;
    projectId?: string;
    userId?: string;
    status?: AgentExecutionStatus;
  } = {}): Promise<any[]> {
    const { limit = 50, offset = 0, projectId, userId, status } = options;

    return prisma.agentTaskExecution.findMany({
      where: {
        agentType: this.agentType,
        ...(projectId && { projectId }),
        ...(userId && { userId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get agent metrics
   */
  async getMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDurationMs: number;
    totalTokensUsed: number;
  }> {
    const where = {
      agentType: this.agentType,
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [total, successful, failed, durationAgg, tokensAgg] = await Promise.all([
      prisma.agentTaskExecution.count({ where }),
      prisma.agentTaskExecution.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.agentTaskExecution.count({ where: { ...where, status: 'FAILED' } }),
      prisma.agentTaskExecution.aggregate({
        where,
        _avg: { durationMs: true },
      }),
      prisma.agentTaskExecution.aggregate({
        where,
        _sum: { tokensUsed: true },
      }),
    ]);

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageDurationMs: durationAgg._avg.durationMs || 0,
      totalTokensUsed: tokensAgg._sum.tokensUsed || 0,
    };
  }
}

/**
 * Agent Registry
 * Singleton that manages all agent instances
 */
class AgentRegistry {
  private agents: Map<AgentType, BaseAgentService> = new Map();

  register(agent: BaseAgentService): void {
    this.agents.set(agent['agentType'], agent);
  }

  get(agentType: AgentType): BaseAgentService | undefined {
    return this.agents.get(agentType);
  }

  getAll(): BaseAgentService[] {
    return Array.from(this.agents.values());
  }

  /**
   * Route a task to the appropriate agent
   */
  async routeTask(input: AgentExecutionInput): Promise<AgentExecutionResult> {
    const task = PLATFORM_TASKS.find(t => t.taskNumber === input.taskNumber);
    if (!task) {
      return {
        success: false,
        executionId: '',
        error: `Task ${input.taskNumber} not found`,
      };
    }

    const agent = this.get(task.agentType);
    if (!agent) {
      return {
        success: false,
        executionId: '',
        error: `No agent registered for type ${task.agentType}`,
      };
    }

    return agent.executeTask(input);
  }
}

// Export singleton registry
export const agentRegistry = new AgentRegistry();

// Export types and utilities
export {
  AgentType,
  PackageTier,
  TaskCategory,
  AGENT_TASK_ASSIGNMENTS,
  PACKAGE_TASK_MAPPING,
  PLATFORM_TASKS,
  getTasksForAgent,
  getTasksForPackage,
  isTaskAvailable,
};
export type { TaskDefinition, AgentDefinition };
