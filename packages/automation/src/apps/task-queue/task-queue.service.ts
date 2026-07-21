import { PrismaClient } from '@prisma/client';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { TASK_TEMPLATES, getPhasesForType } from './task-templates.js';
import type { ProjectType, TaskTemplate } from './task-templates.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-09';

/** Priorities map to a numeric sort weight (lower = higher priority). */
const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

/**
 * Add business days to a date (skips weekends).
 */
function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      remaining--;
    }
  }
  return result;
}

export class TaskQueueService {
  // -----------------------------------------------------------------------
  // createProjectTasks
  // -----------------------------------------------------------------------

  async createProjectTasks(
    projectId: string,
    projectType: ProjectType,
  ): Promise<number> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const templates = TASK_TEMPLATES[projectType];
    if (!templates || templates.length === 0) {
      console.warn(`[TaskQueue] No templates found for project type: ${projectType}`);
      return 0;
    }

    const phases = getPhasesForType(projectType);
    const startDate = project.scheduledStartDate ?? project.actualStartDate ?? new Date();

    // Build a phase-to-start-date map by distributing time across phases
    const totalProjectDays = project.scheduledEndDate
      ? Math.ceil(
          (project.scheduledEndDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Calculate total estimated days per phase
    const phaseDaysMap: Record<string, number> = {};
    for (const tpl of templates) {
      phaseDaysMap[tpl.phase] = (phaseDaysMap[tpl.phase] ?? 0) + tpl.estimatedDays;
    }
    const totalEstDays = Object.values(phaseDaysMap).reduce((a, b) => a + b, 0);

    // Phase start dates: distribute proportionally or use estimated days
    const phaseStartDates: Record<string, Date> = {};
    let cursor = new Date(startDate);
    for (const phase of phases) {
      phaseStartDates[phase] = new Date(cursor);
      const phaseDays = phaseDaysMap[phase] ?? 0;
      if (totalProjectDays > 0 && totalEstDays > 0) {
        // Scale phase duration proportionally to project timeline
        const scaledDays = Math.max(1, Math.round((phaseDays / totalEstDays) * totalProjectDays));
        cursor = addBusinessDays(cursor, scaledDays);
      } else {
        cursor = addBusinessDays(cursor, phaseDays);
      }
    }

    // Create tasks in order
    let sortOrder = 0;
    let createdCount = 0;

    for (const tpl of templates) {
      const phaseStart = phaseStartDates[tpl.phase] ?? startDate;
      const dueDate = addBusinessDays(phaseStart, tpl.estimatedDays);
      sortOrder++;

      await prisma.task.create({
        data: {
          projectId,
          title: tpl.title,
          description:
            tpl.description +
            `\n\nPhase: ${tpl.phase}` +
            `\nEstimated: ${tpl.estimatedDays} business days` +
            (tpl.dependsOn ? `\nDepends on: ${tpl.dependsOn.join(', ')}` : ''),
          status: 'PENDING',
          priority: tpl.priority,
          dueDate,
        },
      });
      createdCount++;

      // Create subtasks
      if (tpl.subtasks) {
        let subCursor = new Date(phaseStart);
        for (const sub of tpl.subtasks) {
          sortOrder++;
          subCursor = addBusinessDays(subCursor, sub.estimatedDays);

          await prisma.task.create({
            data: {
              projectId,
              title: sub.title,
              description:
                sub.description +
                `\n\nParent task: ${tpl.title}` +
                `\nPhase: ${tpl.phase}`,
              status: 'PENDING',
              priority: tpl.priority,
              dueDate: subCursor,
            },
          });
          createdCount++;
        }
      }
    }

    // Update project's currentPhase to the first phase
    await prisma.project.update({
      where: { id: projectId },
      data: { currentPhase: phases[0] },
    });

    // Assign first-phase tasks to PM
    await this.assignTasksToPM(projectId, phases[0]);

    console.log(
      `[TaskQueue] Created ${createdCount} tasks for project ${projectId} (${projectType})`,
    );

    return createdCount;
  }

  // -----------------------------------------------------------------------
  // assignTasksToPM
  // -----------------------------------------------------------------------

  async assignTasksToPM(projectId: string, phase: string): Promise<number> {
    // Get unassigned tasks for this project + phase
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        assignedTo: null,
        status: 'PENDING',
        description: { contains: `Phase: ${phase}` },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (tasks.length === 0) return 0;

    // Get PMs assigned to this project
    const projectManagers = await prisma.projectManager.findMany({
      where: { projectId, removedAt: null },
      include: { user: true },
    });

    // Also include the project's primary PM
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { pmId: true },
    });

    const pmUserIds = new Set<string>();
    if (project?.pmId) pmUserIds.add(project.pmId);
    for (const pm of projectManagers) {
      pmUserIds.add(pm.userId);
    }

    if (pmUserIds.size === 0) {
      console.warn(`[TaskQueue] No PMs found for project ${projectId}`);
      return 0;
    }

    // Get workload for each PM (count of active tasks)
    const workloads: Array<{ userId: string; count: number }> = [];
    for (const userId of pmUserIds) {
      const count = await prisma.task.count({
        where: {
          assignedTo: userId,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      });
      workloads.push({ userId, count });
    }

    // Sort by workload (ascending)
    workloads.sort((a, b) => a.count - b.count);

    // Assign tasks round-robin starting with lowest workload PM
    let assignedCount = 0;
    for (let i = 0; i < tasks.length; i++) {
      const pm = workloads[i % workloads.length];

      await prisma.task.update({
        where: { id: tasks[i].id },
        data: { assignedTo: pm.userId },
      });

      // Create in-app notification for the assigned PM
      await prisma.notification.create({
        data: {
          userId: pm.userId,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `Task "${tasks[i].title}" has been assigned to you.`,
          channels: ['in_app'],
          status: 'SENT',
          sentAt: new Date(),
          data: { taskId: tasks[i].id, projectId },
        },
      });

      assignedCount++;
    }

    console.log(
      `[TaskQueue] Assigned ${assignedCount} tasks for phase "${phase}" on project ${projectId}`,
    );

    return assignedCount;
  }

  // -----------------------------------------------------------------------
  // advanceToNextPhase
  // -----------------------------------------------------------------------

  async advanceToNextPhase(projectId: string): Promise<string | null> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const currentPhase = project.currentPhase;
    if (!currentPhase) {
      console.warn(`[TaskQueue] Project ${projectId} has no currentPhase set`);
      return null;
    }

    // Check if all current phase tasks are complete
    const incompleteTasks = await prisma.task.count({
      where: {
        projectId,
        description: { contains: `Phase: ${currentPhase}` },
        status: { notIn: ['COMPLETED', 'CANCELED'] },
      },
    });

    if (incompleteTasks > 0) {
      console.log(
        `[TaskQueue] Phase "${currentPhase}" has ${incompleteTasks} incomplete tasks — not advancing`,
      );
      return null;
    }

    // Determine all phases for this project by reading existing tasks
    const allTaskDescriptions = await prisma.task.findMany({
      where: { projectId },
      select: { description: true },
    });

    const projectPhases: string[] = [];
    const seenPhases = new Set<string>();
    for (const t of allTaskDescriptions) {
      const match = t.description?.match(/Phase: (\w+)/);
      if (match && !seenPhases.has(match[1])) {
        seenPhases.add(match[1]);
        projectPhases.push(match[1]);
      }
    }

    const currentIndex = projectPhases.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex >= projectPhases.length - 1) {
      // No next phase — project tasks are all done
      console.log(`[TaskQueue] Project ${projectId} has completed all phases`);

      await eventBus.publish(
        EVENT_TYPES.PROJECT_COMPLETED,
        { projectName: project.name ?? projectId },
        SOURCE_APP,
        { projectId },
      );

      return null;
    }

    const nextPhase = projectPhases[currentIndex + 1];

    // Update project's currentPhase
    await prisma.project.update({
      where: { id: projectId },
      data: { currentPhase: nextPhase },
    });

    // Assign next phase tasks
    await this.assignTasksToPM(projectId, nextPhase);

    // Publish status change event
    await eventBus.publish(
      EVENT_TYPES.PROJECT_STATUS_CHANGED,
      {
        previousPhase: currentPhase,
        newPhase: nextPhase,
        projectName: project.name ?? projectId,
      },
      SOURCE_APP,
      { projectId },
    );

    // Update the ProjectPhase record if it exists
    try {
      await prisma.projectPhase.updateMany({
        where: {
          projectId,
          type: currentPhase as any,
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
          actualEndDate: new Date(),
          completedAt: new Date(),
          percentComplete: 100,
        },
      });

      await prisma.projectPhase.updateMany({
        where: {
          projectId,
          type: nextPhase as any,
          status: 'NOT_STARTED',
        },
        data: {
          status: 'IN_PROGRESS',
          actualStartDate: new Date(),
        },
      });
    } catch {
      // ProjectPhase records may not exist for all projects
    }

    console.log(
      `[TaskQueue] Advanced project ${projectId} from "${currentPhase}" to "${nextPhase}"`,
    );

    return nextPhase;
  }

  // -----------------------------------------------------------------------
  // checkOverdueTasks
  // -----------------------------------------------------------------------

  async checkOverdueTasks(): Promise<number> {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELED'] },
        assignedTo: { not: null },
      },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
      },
    });

    let escalatedCount = 0;

    for (const task of overdueTasks) {
      const daysOverdue = Math.ceil(
        (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysOverdue >= 7) {
        // 7+ days overdue: alert admin + publish event
        await eventBus.publish(
          EVENT_TYPES.TASK_OVERDUE,
          {
            taskId: task.id,
            taskTitle: task.title,
            assignedTo: task.assignedTo,
            daysOverdue,
            projectName: task.project?.name ?? '',
            severity: 'CRITICAL',
          },
          SOURCE_APP,
          { projectId: task.projectId ?? undefined },
        );

        // Escalate priority
        if (task.priority !== 'URGENT') {
          await prisma.task.update({
            where: { id: task.id },
            data: { priority: 'URGENT' },
          });
        }

        escalatedCount++;
      } else if (daysOverdue >= 3) {
        // 3+ days overdue: notify PM + escalate priority
        const pmId = task.project?.pmId;
        if (pmId) {
          await prisma.notification.create({
            data: {
              userId: pmId,
              type: 'task_overdue',
              title: 'Task Overdue — Escalated',
              message: `"${task.title}" is ${daysOverdue} days overdue. Priority escalated.`,
              channels: ['in_app'],
              status: 'SENT',
              sentAt: new Date(),
              data: { taskId: task.id, daysOverdue },
            },
          });
        }

        if (task.priority === 'NORMAL' || task.priority === 'LOW') {
          await prisma.task.update({
            where: { id: task.id },
            data: { priority: 'HIGH' },
          });
        }

        escalatedCount++;
      } else if (daysOverdue >= 1) {
        // 1+ day overdue: notify assignee
        if (task.assignedTo) {
          await prisma.notification.create({
            data: {
              userId: task.assignedTo,
              type: 'task_overdue',
              title: 'Task Overdue',
              message: `"${task.title}" is ${daysOverdue} day(s) past due. Please update status.`,
              channels: ['in_app'],
              status: 'SENT',
              sentAt: new Date(),
              data: { taskId: task.id, daysOverdue },
            },
          });
        }
      }
    }

    console.log(
      `[TaskQueue] Overdue check: ${overdueTasks.length} overdue, ${escalatedCount} escalated`,
    );

    return overdueTasks.length;
  }

  // -----------------------------------------------------------------------
  // getWorkloadSummary
  // -----------------------------------------------------------------------

  async getWorkloadSummary(pmId: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    overdue: number;
    completedThisWeek: number;
  }> {
    const now = new Date();

    // Week bounds (Monday to Sunday)
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const [total, todo, inProgress, overdue, completedThisWeek] = await Promise.all([
      prisma.task.count({
        where: {
          assignedTo: pmId,
          status: { notIn: ['COMPLETED', 'CANCELED'] },
        },
      }),
      prisma.task.count({
        where: { assignedTo: pmId, status: 'PENDING' },
      }),
      prisma.task.count({
        where: { assignedTo: pmId, status: 'PROCESSING' },
      }),
      prisma.task.count({
        where: {
          assignedTo: pmId,
          status: { notIn: ['COMPLETED', 'CANCELED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          assignedTo: pmId,
          status: 'COMPLETED',
          completedAt: { gte: weekStart },
        },
      }),
    ]);

    return { total, todo, inProgress, overdue, completedThisWeek };
  }
}
