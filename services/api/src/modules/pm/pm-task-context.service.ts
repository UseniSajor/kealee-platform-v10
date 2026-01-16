/**
 * PM Task Context Service
 * Provides full context for a task including requirements and integration points
 */

import { prismaAny } from '../../utils/prisma-helper'

export interface TaskContext {
  id: string
  title: string
  description?: string
  projectId: string
  projectName: string
  sourceModule: 'GC' | 'Homeowner' | 'Permit' | 'Escrow' | 'Workflow'
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedMinutes: number
  status: string
  requirements: Array<{
    id: string
    type: 'DOCUMENT' | 'APPROVAL' | 'CHECK' | 'INTEGRATION'
    description: string
    completed: boolean
    blocking: boolean
  }>
  integrationPoints: Array<{
    module: string
    action: string
    url?: string
    params?: Record<string, any>
  }>
  metadata?: Record<string, any>
}

export const pmTaskContextService = {
  /**
   * Get full context for a task
   */
  async getTaskContext(taskId: string, userId: string): Promise<TaskContext | null> {
    // Get task (would need to query from appropriate table)
    // For now, return a mock structure
    const task = await prismaAny.task?.findUnique({
      where: { id: taskId },
      include: {
        request: {
          include: {
            plan: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }).catch(() => null)

    if (!task) {
      return null
    }

    // Get project if available
    const project = await prismaAny.project?.findFirst({
      where: {
        ownerId: task.request?.plan?.userId || '',
      },
    }).catch(() => null)

    // Determine source module based on task type
    const sourceModule: TaskContext['sourceModule'] = 'Workflow' // Default

    // Get requirements (would come from task template or SOP)
    const requirements: TaskContext['requirements'] = [
      {
        id: 'req-1',
        type: 'CHECK',
        description: 'Verify all documents are uploaded',
        completed: false,
        blocking: true,
      },
      {
        id: 'req-2',
        type: 'APPROVAL',
        description: 'Get client approval',
        completed: false,
        blocking: true,
      },
    ]

    // Get integration points
    const integrationPoints: TaskContext['integrationPoints'] = [
      {
        module: 'm-project-owner',
        action: 'viewProject',
        url: `/modules/m-project-owner/projects/${project?.id}`,
      },
    ]

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      projectId: project?.id || '',
      projectName: project?.name || 'Unknown Project',
      sourceModule,
      priority: 'MEDIUM', // Would be calculated
      estimatedMinutes: 30, // Would come from task template
      status: task.status,
      requirements,
      integrationPoints,
    }
  },
}
