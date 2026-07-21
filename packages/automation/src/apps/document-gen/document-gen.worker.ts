import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { DocumentGeneratorService } from './document-gen.service.js';

const prisma = new PrismaClient();
const service = new DocumentGeneratorService();
const SOURCE_APP = 'APP-10';

type DocumentType =
  | 'contract'
  | 'proposal'
  | 'sow'
  | 'invoice'
  | 'punch_list'
  | 'letter'
  | 'closeout'
  | 'change_order'
  | 'subcontractor_agreement';

interface GenerateDocumentPayload {
  templateType: DocumentType;
  projectId: string;
  variables: Record<string, any>;
  sendForSignature?: boolean;
  signers?: Array<{ email: string; name: string; role: string }>;
}

interface GenerateContractPayload {
  bidId: string;
  leadId: string;
}

interface GenerateInvoicePayload {
  projectId: string;
  milestoneId: string;
}

interface GeneratePunchListPayload {
  projectId: string;
  qaResultIds: string[];
}

interface SendForSignaturePayload {
  documentId: string;
  signers: Array<{ email: string; name: string; role: string }>;
}

interface GenerateChangeOrderDocPayload {
  changeOrderId: string;
}

interface GenerateCloseoutPayload {
  projectId: string;
}

type DocumentGenPayload =
  | GenerateDocumentPayload
  | GenerateContractPayload
  | GenerateInvoicePayload
  | GeneratePunchListPayload
  | SendForSignaturePayload
  | GenerateChangeOrderDocPayload
  | GenerateCloseoutPayload;

async function processor(job: Job<DocumentGenPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `document-gen:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'generate-document': {
        const payload = job.data as GenerateDocumentPayload;
        const doc = await service.generateDocument({
          templateType: payload.templateType,
          projectId: payload.projectId,
          variables: payload.variables,
          sendForSignature: payload.sendForSignature,
          signers: payload.signers,
        });
        result = { documentId: doc.id, status: doc.status };
        break;
      }

      case 'generate-contract': {
        const payload = job.data as GenerateContractPayload;
        const docId = await service.generateContractFromBid(
          payload.bidId,
          payload.leadId,
        );
        result = { documentId: docId };
        break;
      }

      case 'generate-invoice': {
        const payload = job.data as GenerateInvoicePayload;
        const docId = await service.generateInvoice(
          payload.projectId,
          payload.milestoneId,
        );
        result = { documentId: docId };
        break;
      }

      case 'generate-punch-list': {
        const payload = job.data as GeneratePunchListPayload;
        const docId = await service.generatePunchList(
          payload.projectId,
          payload.qaResultIds,
        );
        result = { documentId: docId };
        break;
      }

      case 'send-for-signature': {
        const payload = job.data as SendForSignaturePayload;
        await service.sendForSignature(payload.documentId, payload.signers);
        result = { documentId: payload.documentId, sent: true };
        break;
      }

      case 'generate-change-order-doc': {
        const payload = job.data as GenerateChangeOrderDocPayload;
        const docId = await service.generateChangeOrderDocument(
          payload.changeOrderId,
        );
        result = { documentId: docId };
        break;
      }

      case 'generate-closeout': {
        const payload = job.data as GenerateCloseoutPayload;
        const docId = await service.generateCloseoutDocument(payload.projectId);
        result = { documentId: docId };
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }

    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', result: result ?? {}, completedAt: new Date() },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}

export const documentGenWorker = createWorker<DocumentGenPayload>(
  QUEUE_NAMES.DOCUMENT_GEN,
  processor,
  { concurrency: 5 },
);
