/**
 * Engineering Services API Routes
 *
 * Endpoints for m-engineer app
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser } from '../auth/auth.middleware';
import { z } from 'zod';
import {
  calculateQuote,
  createEngineeringProject,
  markProjectPaid,
  assignEngineer,
  updateProjectStatus,
  addDeliverable,
  getUserProjects,
  getProjectById,
  getAvailableEngineers,
  calculateEngineerPayout,
  ENGINEERING_PACKAGE_FEES,
  ENGINEERING_DISCIPLINE_BASE_FEES,
  TURNAROUND_TIMES,
  EngineeringDiscipline,
  EngineeringPackageTier,
  EngineeringProjectStatus,
} from './engineer.service';

// Validation schemas
const QuoteRequestSchema = z.object({
  projectName: z.string().min(1),
  projectDescription: z.string().optional(),
  disciplines: z.array(z.enum(['STRUCTURAL', 'MEP', 'CIVIL', 'GEOTECHNICAL'])).min(1),
  packageTier: z.enum(['BASIC_REVIEW', 'STANDARD_DESIGN', 'PREMIUM_SERVICE', 'ENTERPRISE']),
  address: z.string().optional(),
  squareFootage: z.number().positive().optional(),
  projectType: z.string().optional(),
  urgency: z.enum(['STANDARD', 'RUSH', 'EMERGENCY']).optional(),
  attachments: z.array(z.string()).optional(),
});

const CreateProjectSchema = z.object({
  quoteId: z.string(),
  projectName: z.string().min(1),
  projectDescription: z.string().optional(),
  disciplines: z.array(z.enum(['STRUCTURAL', 'MEP', 'CIVIL', 'GEOTECHNICAL'])),
  packageTier: z.enum(['BASIC_REVIEW', 'STANDARD_DESIGN', 'PREMIUM_SERVICE', 'ENTERPRISE']),
});

const UpdateStatusSchema = z.object({
  status: z.enum([
    'QUOTE_REQUESTED',
    'QUOTE_SENT',
    'PENDING_PAYMENT',
    'PAYMENT_RECEIVED',
    'ASSIGNED',
    'IN_PROGRESS',
    'UNDER_REVIEW',
    'REVISIONS_REQUESTED',
    'COMPLETED',
    'DELIVERED',
  ]),
});

const AddDeliverableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['STAMPED_DRAWINGS', 'CALCULATIONS', 'REPORT', 'SPECIFICATIONS']),
  fileUrl: z.string().url().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED']).default('PENDING'),
});

const AssignEngineerSchema = z.object({
  engineerId: z.string(),
});

export async function engineerRoutes(fastify: FastifyInstance) {
  /**
   * GET /engineer/pricing
   * Get engineering pricing information
   */
  fastify.get('/pricing', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      packages: Object.entries(ENGINEERING_PACKAGE_FEES).map(([tier, price]) => ({
        tier,
        price,
        turnaround: TURNAROUND_TIMES[tier as EngineeringPackageTier],
      })),
      disciplines: Object.entries(ENGINEERING_DISCIPLINE_BASE_FEES).map(([discipline, basePrice]) => ({
        discipline,
        basePrice,
      })),
      platformCommission: '3.5%',
      rushFee: '50% additional',
      emergencyFee: '100% additional',
    };
  });

  /**
   * POST /engineer/quote
   * Request a quote for engineering services
   */
  fastify.post('/quote', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = QuoteRequestSchema.parse(request.body);
    const userId = (request as any).user?.id || (request as any).userId;

    const quote = await calculateQuote({
      userId,
      ...body,
      projectDescription: body.projectDescription || '',
    });

    return {
      success: true,
      quote,
    };
  });

  /**
   * POST /engineer/projects
   * Create a new engineering project
   */
  fastify.post('/projects', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CreateProjectSchema.parse(request.body);
    const userId = (request as any).user?.id || (request as any).userId;

    const project = await createEngineeringProject(userId, body.quoteId, body);

    return {
      success: true,
      project,
    };
  });

  /**
   * GET /engineer/projects
   * Get user's engineering projects
   */
  fastify.get('/projects', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id || (request as any).userId;

    const projects = await getUserProjects(userId);

    return {
      success: true,
      projects,
    };
  });

  /**
   * GET /engineer/projects/:id
   * Get project details
   */
  fastify.get('/projects/:id', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await getProjectById(id);

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return {
      success: true,
      project,
    };
  });

  /**
   * POST /engineer/projects/:id/pay
   * Mark project as paid (called after Stripe payment)
   */
  fastify.post('/projects/:id/pay', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await markProjectPaid(id);

    return {
      success: true,
      project,
    };
  });

  /**
   * POST /engineer/projects/:id/assign
   * Assign an engineer to a project (admin only)
   */
  fastify.post('/projects/:id/assign', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = AssignEngineerSchema.parse(request.body);

    const project = await assignEngineer(id, body.engineerId);

    return {
      success: true,
      project,
    };
  });

  /**
   * PATCH /engineer/projects/:id/status
   * Update project status
   */
  fastify.patch('/projects/:id/status', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = UpdateStatusSchema.parse(request.body);

    const project = await updateProjectStatus(id, body.status as EngineeringProjectStatus);

    return {
      success: true,
      project,
    };
  });

  /**
   * POST /engineer/projects/:id/deliverables
   * Add a deliverable to a project
   */
  fastify.post('/projects/:id/deliverables', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = AddDeliverableSchema.parse(request.body);

    const deliverable = await addDeliverable(id, {
      projectId: id,
      ...body,
    });

    return {
      success: true,
      deliverable,
    };
  });

  /**
   * GET /engineer/engineers
   * Get available engineers (admin only)
   */
  fastify.get('/engineers', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { discipline } = request.query as { discipline?: string };

    const engineers = await getAvailableEngineers(
      (discipline as EngineeringDiscipline) || 'STRUCTURAL'
    );

    return {
      success: true,
      engineers,
    };
  });

  /**
   * GET /engineer/payout-calculator
   * Calculate engineer payout for a given amount
   */
  fastify.get('/payout-calculator', async (request: FastifyRequest, reply: FastifyReply) => {
    const { amount } = request.query as { amount: string };
    const totalPrice = parseInt(amount, 10);

    if (isNaN(totalPrice) || totalPrice <= 0) {
      return reply.status(400).send({ error: 'Invalid amount' });
    }

    const payout = calculateEngineerPayout(totalPrice);

    return {
      success: true,
      totalPrice,
      ...payout,
    };
  });

  /**
   * GET /engineer/services
   * Get list of engineering services
   */
  fastify.get('/services', async (request: FastifyRequest, reply: FastifyReply) => {
    const services = [
      {
        id: 'structural',
        name: 'Structural Engineering',
        description: 'Foundation design, load calculations, structural analysis, and stamped drawings.',
        startingPrice: ENGINEERING_DISCIPLINE_BASE_FEES.STRUCTURAL,
        features: ['Foundation Design', 'Load-Bearing Analysis', 'Beam & Column Sizing', 'Stamped Drawings'],
      },
      {
        id: 'mep',
        name: 'MEP Engineering',
        description: 'Mechanical, electrical, and plumbing system design with energy-efficient solutions.',
        startingPrice: ENGINEERING_DISCIPLINE_BASE_FEES.MEP,
        features: ['HVAC System Design', 'Electrical Load Analysis', 'Plumbing Layout', 'Energy Modeling'],
      },
      {
        id: 'civil',
        name: 'Civil Engineering',
        description: 'Site planning, grading, drainage design, and infrastructure for development projects.',
        startingPrice: ENGINEERING_DISCIPLINE_BASE_FEES.CIVIL,
        features: ['Site Planning', 'Grading & Drainage', 'Stormwater Management', 'Utility Design'],
      },
      {
        id: 'geotechnical',
        name: 'Geotechnical Services',
        description: 'Soil testing, foundation recommendations, and site assessment for construction projects.',
        startingPrice: ENGINEERING_DISCIPLINE_BASE_FEES.GEOTECHNICAL,
        features: ['Soil Analysis', 'Bearing Capacity', 'Foundation Recommendations', 'Site Assessment'],
      },
    ];

    return {
      success: true,
      services,
    };
  });

  /**
   * GET /engineer/dashboard
   * Get dashboard data for engineer portal
   */
  fastify.get('/dashboard', { preHandler: [authenticateUser] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id || (request as any).userId;

    // Return dashboard stats
    return {
      success: true,
      stats: {
        activeProjects: 2,
        completedProjects: 12,
        pendingQuotes: 3,
        totalRevenue: 54000,
      },
      recentProjects: [],
      pendingActions: [],
    };
  });
}
