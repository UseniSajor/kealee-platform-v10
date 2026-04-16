import { FastifyInstance } from "fastify";
import { z } from "zod";
import { runZoningBot } from "../services/zoning-bot-service";
import { ZoningIntakeSchema } from "@kealee/core-rules";

/**
 * Public Zoning Intake Routes
 * Handles zoning analysis and compliance checks
 * POST /api/zoning/intake - Process new zoning request
 * GET /api/zoning/status/:id - Check zoning analysis status
 */
export async function registerPublicZoningRoutes(app: FastifyInstance) {
  // POST /api/zoning/intake
  app.post<{ Body: z.infer<typeof ZoningIntakeSchema> }>(
    "/api/zoning/intake",
    {
      schema: {
        body: {
          type: "object",
          required: ["location", "propertySize", "projectType", "email"],
          properties: {
            location: {
              type: "string",
              pattern: "^[0-9]{5}$",
              description: "5-digit zip code",
            },
            propertySize: {
              type: "number",
              minimum: 100,
              description: "Property size in square feet",
            },
            projectType: {
              type: "string",
              enum: ["garden", "kitchen", "landscape", "renovation"],
              description: "Type of project",
            },
            email: {
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
              zoningId: { type: "string" },
              zoning: {
                type: "object",
                properties: {
                  jurisdiction: { type: "string" },
                  zoning: { type: "string" },
                  setbacks: { type: "object" },
                  far: { type: "number" },
                  permitType: { type: "array" },
                  requirements: { type: "array" },
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
        const { location, propertySize, projectType, email } = request.body;

        console.log(
          `Processing zoning intake: ${projectType} in ${location} by ${email}`
        );

        // Run ZoningBot
        const zoning = await runZoningBot({
          location,
          propertySize,
          projectType: projectType as
            | "garden"
            | "kitchen"
            | "landscape"
            | "renovation",
          email,
        });

        const zoningId = `zoning_${Date.now()}`;

        reply.status(200).send({
          success: true,
          zoningId,
          zoning,
          nextStep: "/permits",
        });
      } catch (error) {
        console.error("Zoning intake error:", error);
        reply.status(500).send({
          success: false,
          error: `Failed to process zoning: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  );

  // GET /api/zoning/status/:id
  app.get<{ Params: { id: string } }>(
    "/api/zoning/status/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Zoning intake ID",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              zoning: { type: "object" },
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
        console.log(`Fetching zoning status: ${id}`);

        // TODO: Implement database lookup
        // For now, return placeholder
        reply.status(200).send({
          id,
          status: "received",
          zoning: null,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Status lookup error:", error);
        reply.status(404).send({
          error: `Zoning analysis not found: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }
  );
}
