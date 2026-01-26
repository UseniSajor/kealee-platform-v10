// ============================================================================
// COMPLETE API ROUTES
// ============================================================================
// packages/automation/src/api/routes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queues, JOB_OPTIONS } from '../shared/queue';
import { prisma } from '@kealee/database';

// ============================================================================
// BID ENGINE ROUTES
// ============================================================================

export async function bidEngineRoutes(fastify: FastifyInstance) {
  // Create bid request
  fastify.post('/bid-requests', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, trades, scope, requirements, deadline } = request.body as any;

    const job = await queues.BID_ENGINE.add('create-bid-request', {
      type: 'CREATE_BID_REQUEST',
      projectId,
      trades,
      scope,
      requirements,
      deadline,
    }, JOB_OPTIONS.DEFAULT);

    return { jobId: job.id, status: 'processing' };
  });

  // Get bid request
  fastify.get('/bid-requests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const bidRequest = await prisma.bidRequest.findUnique({
      where: { id },
      include: {
        project: true,
        invitations: { include: { contractor: true } },
        submissions: { include: { contractor: true } },
      },
    });

    if (!bidRequest) {
      return reply.status(404).send({ error: 'Bid request not found' });
    }

    return bidRequest;
  });

  // Trigger bid analysis
  fastify.post('/bid-requests/:id/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.BID_ENGINE.add('analyze-bids', {
      type: 'ANALYZE_BIDS',
      bidRequestId: id,
    }, JOB_OPTIONS.HIGH_PRIORITY);

    return { jobId: job.id, status: 'analyzing' };
  });

  // Find matching contractors
  fastify.post('/contractors/match', async (request: FastifyRequest, reply: FastifyReply) => {
    const criteria = request.body as any;

    const job = await queues.BID_ENGINE.add('find-contractors', {
      type: 'FIND_CONTRACTORS',
      bidRequestId: null,
      criteria,
    }, JOB_OPTIONS.DEFAULT);

    // Wait for result
    const result = await job.waitUntilFinished(queues.BID_ENGINE);
    return result;
  });
}

// ============================================================================
// VISIT SCHEDULER ROUTES
// ============================================================================

export async function visitSchedulerRoutes(fastify: FastifyInstance) {
  // Schedule a visit
  fastify.post('/visits', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, pmId, visitType, preferredDates, duration, priority, notes } = request.body as any;

    const job = await queues.VISIT_SCHEDULER.add('schedule-visit', {
      type: 'SCHEDULE_VISIT',
      request: { projectId, pmId, visitType, preferredDates, duration, priority, notes },
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.VISIT_SCHEDULER);
    return result;
  });

  // Get PM schedule
  fastify.get('/visits/pm/:pmId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId } = request.params as { pmId: string };
    const { startDate, endDate } = request.query as any;

    const visits = await prisma.siteVisit.findMany({
      where: {
        pmId,
        scheduledAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: { project: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return visits;
  });

  // Get project visits
  fastify.get('/visits/project/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const visits = await prisma.siteVisit.findMany({
      where: { projectId },
      include: { pm: true },
      orderBy: { scheduledAt: 'desc' },
    });

    return visits;
  });

  // Optimize route
  fastify.post('/visits/optimize-route', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId, date } = request.body as any;

    const job = await queues.VISIT_SCHEDULER.add('optimize-route', {
      type: 'OPTIMIZE_ROUTE',
      pmId,
      date,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.VISIT_SCHEDULER);
    return result;
  });

  // Complete visit
  fastify.post('/visits/:id/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { notes, photos } = request.body as any;

    const visit = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
        photos,
      },
    });

    return visit;
  });

  // Cancel visit
  fastify.post('/visits/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as any;

    const visit = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
      },
    });

    return visit;
  });
}

// ============================================================================
// CHANGE ORDER ROUTES
// ============================================================================

export async function changeOrderRoutes(fastify: FastifyInstance) {
  // Create change order
  fastify.post('/change-orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    const job = await queues.CHANGE_ORDER.add('create', {
      type: 'CREATE_CHANGE_ORDER',
      request: body,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.CHANGE_ORDER);
    return result;
  });

  // Get change order
  fastify.get('/change-orders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const co = await prisma.changeOrder.findUnique({
      where: { id },
      include: { project: true },
    });

    return co;
  });

  // Analyze impact
  fastify.post('/change-orders/:id/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.CHANGE_ORDER.add('analyze', {
      type: 'ANALYZE_IMPACT',
      changeOrderId: id,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.CHANGE_ORDER);
    return result;
  });

  // Submit for approval
  fastify.post('/change-orders/:id/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // First analyze if not done
    const co = await prisma.changeOrder.findUnique({ where: { id } });
    if (!co?.impactAnalysis) {
      await queues.CHANGE_ORDER.add('analyze', {
        type: 'ANALYZE_IMPACT',
        changeOrderId: id,
      }, JOB_OPTIONS.DEFAULT);
    }

    const job = await queues.CHANGE_ORDER.add('submit', {
      type: 'INITIATE_APPROVAL',
      changeOrderId: id,
    }, JOB_OPTIONS.DEFAULT);

    return { status: 'submitted' };
  });

  // Get project change orders
  fastify.get('/projects/:projectId/change-orders', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      orderBy: { number: 'desc' },
    });

    return changeOrders;
  });
}

// ============================================================================
// REPORT ROUTES
// ============================================================================

export async function reportRoutes(fastify: FastifyInstance) {
  // Generate report
  fastify.post('/reports/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, type, periodStart, periodEnd } = request.body as any;

    const job = await queues.REPORT_GENERATOR.add('generate', {
      type: 'GENERATE_REPORT',
      config: {
        projectId,
        type,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.REPORT_GENERATOR);
    return result;
  });

  // Get report
  fastify.get('/reports/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const report = await prisma.report.findUnique({
      where: { id },
      include: { project: true },
    });

    return report;
  });

  // Send report
  fastify.post('/reports/:id/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { recipients } = request.body as any;

    const job = await queues.REPORT_GENERATOR.add('send', {
      type: 'SEND_REPORT',
      reportId: id,
      recipients,
    }, JOB_OPTIONS.DEFAULT);

    return { status: 'sending' };
  });

  // Get project reports
  fastify.get('/projects/:projectId/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const reports = await prisma.report.findMany({
      where: { projectId },
      orderBy: { generatedAt: 'desc' },
    });

    return reports;
  });
}

// ============================================================================
// PERMIT ROUTES
// ============================================================================

export async function permitRoutes(fastify: FastifyInstance) {
  // Get project permits
  fastify.get('/projects/:projectId/permits', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const permits = await prisma.permit.findMany({
      where: { projectId },
      include: {
        jurisdiction: true,
        inspections: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return permits;
  });

  // Check permit status
  fastify.get('/permits/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.PERMIT_TRACKER.add('check', {
      type: 'CHECK_STATUS',
      permitId: id,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.PERMIT_TRACKER);
    return result;
  });

  // Determine required permits
  fastify.post('/permits/determine', async (request: FastifyRequest, reply: FastifyReply) => {
    const requirements = request.body as any;

    const job = await queues.PERMIT_TRACKER.add('determine', {
      type: 'DETERMINE_PERMITS',
      requirements,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.PERMIT_TRACKER);
    return result;
  });
}

// ============================================================================
// INSPECTION ROUTES
// ============================================================================

export async function inspectionRoutes(fastify: FastifyInstance) {
  // Schedule inspection
  fastify.post('/inspections/schedule', async (request: FastifyRequest, reply: FastifyReply) => {
    const { permitId, type, preferredDates, contactPhone } = request.body as any;

    const job = await queues.INSPECTION.add('schedule', {
      type: 'SCHEDULE',
      request: { permitId, type, preferredDates, contactPhone },
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.INSPECTION);
    return result;
  });

  // Get inspection checklist
  fastify.get('/inspections/:id/checklist', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.INSPECTION.add('checklist', {
      type: 'GENERATE_CHECKLIST',
      inspectionId: id,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.INSPECTION);
    return result;
  });

  // Record inspection result
  fastify.post('/inspections/:id/result', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { passed, notes, corrections } = request.body as any;

    const job = await queues.INSPECTION.add('record-result', {
      type: 'RECORD_RESULT',
      inspectionId: id,
      result: { passed, notes, corrections },
    }, JOB_OPTIONS.DEFAULT);

    return { status: 'recorded' };
  });
}

// ============================================================================
// BUDGET ROUTES
// ============================================================================

export async function budgetRoutes(fastify: FastifyInstance) {
  // Record transaction
  fastify.post('/budget/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    const entry = request.body as any;

    const job = await queues.BUDGET_TRACKER.add('record', {
      type: 'RECORD_TRANSACTION',
      entry,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.BUDGET_TRACKER);
    return result;
  });

  // Get budget summary
  fastify.get('/projects/:projectId/budget', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.BUDGET_TRACKER.add('summary', {
      type: 'GET_SUMMARY',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.BUDGET_TRACKER);
    return result;
  });

  // Get budget report
  fastify.get('/projects/:projectId/budget/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.BUDGET_TRACKER.add('report', {
      type: 'GENERATE_REPORT',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.BUDGET_TRACKER);
    return result;
  });
}

// ============================================================================
// TASK ROUTES
// ============================================================================

export async function taskRoutes(fastify: FastifyInstance) {
  // Create task
  fastify.post('/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const definition = request.body as any;

    const job = await queues.TASK_QUEUE.add('create', {
      type: 'CREATE_TASK',
      definition,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.TASK_QUEUE);
    return result;
  });

  // Get task queue
  fastify.get('/tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId, status } = request.query as any;

    const where: any = {};
    if (pmId) where.assignedPmId = pmId;
    if (status) where.status = status;

    const tasks = await prisma.automationTask.findMany({
      where,
      include: {
        project: { select: { name: true } },
        assignedPm: { select: { name: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
    });

    return tasks;
  });

  // Complete task
  fastify.post('/tasks/:id/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { result } = request.body as any;

    const job = await queues.TASK_QUEUE.add('complete', {
      type: 'COMPLETE_TASK',
      taskId: id,
      result,
    }, JOB_OPTIONS.DEFAULT);

    return { status: 'completed' };
  });

  // Get PM workload
  fastify.get('/tasks/workload/:pmId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId } = request.params as { pmId: string };

    const job = await queues.TASK_QUEUE.add('workload', {
      type: 'GET_WORKLOAD',
      pmId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.TASK_QUEUE);
    return result;
  });
}

// ============================================================================
// DOCUMENT ROUTES
// ============================================================================

export async function documentRoutes(fastify: FastifyInstance) {
  // Generate document
  fastify.post('/documents/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const docRequest = request.body as any;

    const job = await queues.DOCUMENT_GENERATOR.add('generate', {
      type: 'GENERATE',
      request: docRequest,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DOCUMENT_GENERATOR);
    return result;
  });

  // Generate punch list
  fastify.post('/documents/punch-list', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.body as any;

    const job = await queues.DOCUMENT_GENERATOR.add('punch-list', {
      type: 'GENERATE_PUNCH_LIST',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DOCUMENT_GENERATOR);
    return result;
  });

  // Generate contract
  fastify.post('/documents/contract', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, contractorId, amount, scope } = request.body as any;

    const job = await queues.DOCUMENT_GENERATOR.add('contract', {
      type: 'GENERATE_CONTRACT',
      projectId,
      contractorId,
      amount,
      scope,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DOCUMENT_GENERATOR);
    return result;
  });
}

// ============================================================================
// AI/ML ROUTES
// ============================================================================

export async function aiRoutes(fastify: FastifyInstance) {
  // Predict delay
  fastify.get('/ai/predict/delay/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.PREDICTIVE.add('predict-delay', {
      type: 'PREDICT_DELAY',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.PREDICTIVE);
    return result;
  });

  // Predict cost overrun
  fastify.get('/ai/predict/cost/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.PREDICTIVE.add('predict-cost', {
      type: 'PREDICT_COST_OVERRUN',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.PREDICTIVE);
    return result;
  });

  // Full risk analysis
  fastify.get('/ai/risk/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.PREDICTIVE.add('full-analysis', {
      type: 'FULL_RISK_ANALYSIS',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.PREDICTIVE);
    return result;
  });

  // Analyze photo
  fastify.post('/ai/analyze-photo', async (request: FastifyRequest, reply: FastifyReply) => {
    const photoRequest = request.body as any;

    const job = await queues.QA_INSPECTOR.add('analyze', {
      type: 'ANALYZE_PHOTO',
      request: photoRequest,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.QA_INSPECTOR);
    return result;
  });

  // Quality score
  fastify.get('/ai/quality-score/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.QA_INSPECTOR.add('quality-score', {
      type: 'CALCULATE_QUALITY_SCORE',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.QA_INSPECTOR);
    return result;
  });

  // Decision support
  fastify.post('/ai/decision', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = request.body as any;

    const job = await queues.DECISION_SUPPORT.add('recommend', {
      type: 'GET_RECOMMENDATION',
      context,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DECISION_SUPPORT);
    return result;
  });

  // Project insights
  fastify.get('/ai/insights/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.DECISION_SUPPORT.add('insights', {
      type: 'GET_INSIGHTS',
      projectId,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DECISION_SUPPORT);
    return result;
  });

  // AI chat
  fastify.post('/ai/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, message, history } = request.body as any;

    const job = await queues.DECISION_SUPPORT.add('chat', {
      type: 'CHAT',
      projectId,
      message,
      history,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.DECISION_SUPPORT);
    return result;
  });
}

// ============================================================================
// COMMUNICATION ROUTES
// ============================================================================

export async function communicationRoutes(fastify: FastifyInstance) {
  // Send message
  fastify.post('/communications/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const commRequest = request.body as any;

    const job = await queues.COMMUNICATION.add('send', {
      type: 'SEND',
      request: commRequest,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.COMMUNICATION);
    return result;
  });

  // Send bulk notification
  fastify.post('/communications/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, roles, template, variables, priority } = request.body as any;

    const job = await queues.COMMUNICATION.add('bulk', {
      type: 'SEND_BULK',
      projectId,
      roles,
      template,
      variables,
      priority,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.COMMUNICATION);
    return result;
  });

  // Get communication log
  fastify.get('/projects/:projectId/communications', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const logs = await prisma.communicationLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs;
  });
}

// ============================================================================
// SCHEDULE OPTIMIZATION ROUTES
// ============================================================================

export async function scheduleRoutes(fastify: FastifyInstance) {
  // Optimize project schedule
  fastify.post('/schedule/optimize', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, constraints } = request.body as any;

    const job = await queues.SMART_SCHEDULER.add('optimize', {
      type: 'OPTIMIZE_SCHEDULE',
      request: { projectId, constraints },
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.SMART_SCHEDULER);
    return result;
  });

  // Detect conflicts
  fastify.get('/schedule/conflicts/:pmId/:date', async (request: FastifyRequest, reply: FastifyReply) => {
    const { pmId, date } = request.params as { pmId: string; date: string };

    const job = await queues.SMART_SCHEDULER.add('detect-conflicts', {
      type: 'DETECT_CONFLICTS',
      pmId,
      date,
    }, JOB_OPTIONS.DEFAULT);

    const result = await job.waitUntilFinished(queues.SMART_SCHEDULER);
    return result;
  });
}

// ============================================================================
// REGISTER ALL ROUTES
// ============================================================================

export async function registerAllRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

  // Register all route groups
  await fastify.register(bidEngineRoutes, { prefix: '/api/v1' });
  await fastify.register(visitSchedulerRoutes, { prefix: '/api/v1' });
  await fastify.register(changeOrderRoutes, { prefix: '/api/v1' });
  await fastify.register(reportRoutes, { prefix: '/api/v1' });
  await fastify.register(permitRoutes, { prefix: '/api/v1' });
  await fastify.register(inspectionRoutes, { prefix: '/api/v1' });
  await fastify.register(budgetRoutes, { prefix: '/api/v1' });
  await fastify.register(taskRoutes, { prefix: '/api/v1' });
  await fastify.register(documentRoutes, { prefix: '/api/v1' });
  await fastify.register(aiRoutes, { prefix: '/api/v1' });
  await fastify.register(communicationRoutes, { prefix: '/api/v1' });
  await fastify.register(scheduleRoutes, { prefix: '/api/v1' });

  console.log('📚 All API routes registered');
}
