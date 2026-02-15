import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function documentRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List documents (optionally filtered by project, type, or status)
    // -----------------------------------------------------------------------
    fastify.get('/', async (request) => {
      const { projectId, type, category, status } = request.query as {
        projectId?: string;
        type?: string;
        category?: string;
        status?: string;
      };

      const documents = await prisma.document.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(type && { type }),
          ...(category && { category }),
          ...(status && { status }),
        },
        include: {
          template: true,
          distributions: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: documents };
    });

    // -----------------------------------------------------------------------
    // Get single document with full detail
    // -----------------------------------------------------------------------
    fastify.get('/:id', async (request) => {
      const { id } = request.params as { id: string };

      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          template: true,
          distributions: true,
        },
      });

      if (!document) {
        return { error: 'Document not found', statusCode: 404 };
      }

      return { data: document };
    });

    // -----------------------------------------------------------------------
    // Generate a document from a template
    // -----------------------------------------------------------------------
    fastify.post('/generate', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        templateId?: string;
        documentType: string;
        variables?: Record<string, unknown>;
      };

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('generate-ai-narrative', {
        projectId: body.projectId,
        organizationId: body.organizationId,
        narrativeType: body.documentType,
        context: {
          templateId: body.templateId,
          variables: body.variables,
        },
      });

      return {
        data: {
          queued: true,
          projectId: body.projectId,
          documentType: body.documentType,
        },
      };
    });

    // -----------------------------------------------------------------------
    // Generate AIA G702 (Application and Certificate for Payment)
    // -----------------------------------------------------------------------
    fastify.post('/generate/aia-g702', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        contractId: string;
        periodEnd: string;
      };

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('generate-aia-g702', body);

      return {
        data: { queued: true, documentType: 'AIA_G702' },
      };
    });

    // -----------------------------------------------------------------------
    // Generate AIA G703 (Continuation Sheet)
    // -----------------------------------------------------------------------
    fastify.post('/generate/aia-g703', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        contractId: string;
        periodEnd: string;
      };

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('generate-aia-g703', body);

      return {
        data: { queued: true, documentType: 'AIA_G703' },
      };
    });

    // -----------------------------------------------------------------------
    // Generate lien waiver
    // -----------------------------------------------------------------------
    fastify.post('/generate/lien-waiver', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        waiverType: string;
        contractorId: string;
        amount: number;
        throughDate: string;
      };

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('generate-lien-waiver', body);

      return {
        data: { queued: true, documentType: 'LIEN_WAIVER', waiverType: body.waiverType },
      };
    });

    // -----------------------------------------------------------------------
    // Generate RFI
    // -----------------------------------------------------------------------
    fastify.post('/generate/rfi', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        subject: string;
        description: string;
        to: string;
        from: string;
        discipline?: string;
      };

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('generate-rfi', body);

      return {
        data: { queued: true, documentType: 'RFI', subject: body.subject },
      };
    });

    // -----------------------------------------------------------------------
    // Request e-signature for a document
    // -----------------------------------------------------------------------
    fastify.post('/:id/request-signature', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        signers: Array<{ email: string; name: string; role: string }>;
      };

      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) {
        return { error: 'Document not found', statusCode: 404 };
      }

      const queue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await queue.add('request-esignature', {
        documentId: id,
        projectId: document.projectId,
        organizationId: null,
        signers: body.signers,
      });

      return {
        data: {
          queued: true,
          documentId: id,
          signerCount: body.signers.length,
        },
      };
    });

    // -----------------------------------------------------------------------
    // List generated documents
    // -----------------------------------------------------------------------
    fastify.get('/generated', async (request) => {
      const { projectId, type, status } = request.query as {
        projectId?: string;
        type?: string;
        status?: string;
      };

      const docs = await prisma.generatedDocument.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(type && { type }),
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: docs };
    });

    // -----------------------------------------------------------------------
    // List document templates
    // -----------------------------------------------------------------------
    fastify.get('/templates', async (request) => {
      const { type, category } = request.query as {
        type?: string;
        category?: string;
      };

      const templates = await prisma.documentTemplate.findMany({
        where: {
          isActive: true,
          ...(type && { type }),
          ...(category && { category }),
        },
        orderBy: { name: 'asc' },
      });

      return { data: templates };
    });

    // -----------------------------------------------------------------------
    // Get single template
    // -----------------------------------------------------------------------
    fastify.get('/templates/:id', async (request) => {
      const { id } = request.params as { id: string };

      const template = await prisma.documentTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return { error: 'Template not found', statusCode: 404 };
      }

      return { data: template };
    });

    // -----------------------------------------------------------------------
    // List communication logs
    // -----------------------------------------------------------------------
    fastify.get('/communications', async (request) => {
      const { projectId, channel, status } = request.query as {
        projectId?: string;
        channel?: string;
        status?: string;
      };

      const logs = await prisma.communicationLog.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(channel && { channel }),
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return { data: logs };
    });

    // -----------------------------------------------------------------------
    // Send a direct email via the comms hub
    // -----------------------------------------------------------------------
    fastify.post('/communications/send-email', async (request) => {
      const body = request.body as {
        projectId?: string;
        recipientEmail: string;
        subject: string;
        body: string;
        templateId?: string;
        templateData?: Record<string, unknown>;
      };

      const queue = createQueue(KEALEE_QUEUES.COMMUNICATION);
      await queue.add('send-email', body);

      return {
        data: {
          queued: true,
          recipientEmail: body.recipientEmail,
        },
      };
    });

    // -----------------------------------------------------------------------
    // Broadcast notification to project team
    // -----------------------------------------------------------------------
    fastify.post('/communications/broadcast', async (request) => {
      const body = request.body as {
        projectId: string;
        type: string;
        subject: string;
        body: string;
        channels: string[];
      };

      const queue = createQueue(KEALEE_QUEUES.COMMUNICATION);
      await queue.add('broadcast', body);

      return {
        data: {
          queued: true,
          projectId: body.projectId,
          channels: body.channels,
        },
      };
    });
  };
}
