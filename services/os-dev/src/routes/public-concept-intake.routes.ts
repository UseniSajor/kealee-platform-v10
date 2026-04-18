import { FastifyInstance } from "fastify";
import { z } from "zod";
import { runDesignBot } from "../services/design-bot-service";
import { ConceptIntakeSchema } from "@kealee/core-rules";

/**
 * Public Concept Intake Routes
 * Handles design concept generation for homeowners
 * POST /api/concept/intake - Process new concept request
 * GET /api/concept/status/:id - Check concept status
 */
export async function registerPublicConceptRoutes(app: FastifyInstance) {
  // POST /api/concept/intake
  app.post<{ Body: z.infer<typeof ConceptIntakeSchema> }>(
    "/api/concept/intake",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "projectType",
            "scope",
            "budget",
            "location",
            "homeownerEmail",
          ],
          properties: {
            projectType: {
              type: "string",
              enum: ["garden", "kitchen", "landscape", "renovation"],
              description: "Type of project",
            },
            scope: {
              type: "string",
              description: "Project scope and description",
            },
            budget: {
              type: "number",
              minimum: 100,
              description: "Budget in dollars",
            },
            location: {
              type: "string",
              pattern: "^[0-9]{5}$",
              description: "5-digit zip code",
            },
            homeownerEmail: {
              type: "string",
              format: "email",
              description: "Homeowner email address",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              conceptId: { type: "string" },
              concept: {
                type: "object",
                properties: {
                  mepSystem: { type: "object" },
                  billOfMaterials: { type: "array" },
                  estimatedCost: { type: "number" },
                  description: { type: "string" },
                },
              },
              nextStep: { type: "string" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          projectType,
          scope,
          budget,
          location,
          homeownerEmail,
        } = request.body;

        console.log(
          `Processing concept intake: ${projectType} in ${location} by ${homeownerEmail}`
        );

        // Run DesignBot
        const concept = await runDesignBot({
          projectType: projectType as
            | "garden"
            | "kitchen"
            | "landscape"
            | "renovation",
          scope,
          budget,
          location,
          email: homeownerEmail,
        });

        const conceptId = `concept_${Date.now()}`;

        reply.status(200).send({
          success: true,
          conceptId,
          concept,
          nextStep: "/estimate",
        });
      } catch (error) {
        console.error("Concept intake error:", error);
        reply.status(500).send({
          success: false,
          error: `Failed to process concept: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  );

  // GET /api/concept/status/:id
  app.get<{ Params: { id: string } }>(
    "/api/concept/status/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Concept intake ID",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              concept: { type: "object" },
              createdAt: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        console.log(`Fetching concept status: ${id}`);

        // TODO: Implement database lookup
        // For now, return placeholder
        reply.status(200).send({
          id,
          status: "received",
          concept: null,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Status lookup error:", error);
        reply.status(404).send({
          error: `Concept not found: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  );
}
