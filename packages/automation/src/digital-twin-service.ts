// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DigitalTwinService {
  /**
   * Fetches the Hybrid Digital Twin for a project.
   * Merges relational fields with the JSONB flexible state.
   */
  async getTwin(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        loopRuns: true,
        decisions: true,
        automationEvents: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    return {
      // Typed core fields
      id: project.id,
      status: project.status,
      address: project.address,
      budgetTotal: project.budgetTotal,
      currentPhase: project.currentPhase,
      // JSONB flexible state
      digitalTwinState: (project.digitalTwinState as Record<string, any>) || {},
      agentMemory: (project.agentMemory as Record<string, any>) || {},
      riskSnapshot: (project.riskSnapshot as Record<string, any>) || {},
    };
  }

  /**
   * Updates the Hybrid Digital Twin.
   * Automatically routes updates to typed relational columns when possible,
   * otherwise stores in JSONB flexible state.
   */
  async updateTwin(projectId: string, updates: Record<string, any>) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error('Project not found');

    const dataPayload: any = {};
    const currentTwinState = (project.digitalTwinState as Record<string, any>) || {};
    const newTwinState = { ...currentTwinState };

    // Hybrid routing
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'status' || key === 'address' || key === 'budgetTotal' || key === 'currentPhase') {
        dataPayload[key] = value;
      } else if (key === 'agentMemory') {
        dataPayload.agentMemory = {
          ...((project.agentMemory as Record<string, any>) || {}),
          ...value,
        };
      } else if (key === 'riskSnapshot') {
        dataPayload.riskSnapshot = {
          ...((project.riskSnapshot as Record<string, any>) || {}),
          ...value,
        };
      } else {
        newTwinState[key] = value;
      }
    }

    if (Object.keys(newTwinState).length > 0) {
      dataPayload.digitalTwinState = newTwinState;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: dataPayload,
    });
  }

  /**
   * Create an audit record for an automation event.
   */
  async logEvent(projectId: string, eventName: string, payload: any) {
    return prisma.automationEvent.create({
      data: {
        projectId,
        eventName,
        payload,
      },
    });
  }
}

export const digitalTwinService = new DigitalTwinService();
