/**
 * OpenAPI Specification Generator
 * Generates OpenAPI 3.0 specification from Fastify routes
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Kealee Permits & Inspections API',
    version: '1.0.0',
    description: 'Unified API platform for permits and inspections management',
    contact: {
      name: 'Kealee API Support',
      email: 'api@kealee.com',
    },
  },
  servers: [
    {
      url: 'https://api.kealee.com',
      description: 'Production server',
    },
    {
      url: 'https://api-staging.kealee.com',
      description: 'Staging server',
    },
  ],
  tags: [
    {name: 'permits', description: 'Permit management'},
    {name: 'inspections', description: 'Inspection management'},
    {name: 'documents', description: 'Document management'},
    {name: 'webhooks', description: 'Webhook management'},
    {name: 'api-keys', description: 'API key management'},
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Permit: {
        type: 'object',
        properties: {
          id: {type: 'string', format: 'uuid'},
          permitNumber: {type: 'string'},
          jurisdictionId: {type: 'string', format: 'uuid'},
          propertyId: {type: 'string', format: 'uuid'},
          type: {
            type: 'string',
            enum: ['BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'DEMOLITION', 'SIGN', 'GRADING', 'FENCE'],
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTIONS_REQUIRED', 'RESUBMITTED', 'APPROVED', 'ISSUED', 'ACTIVE', 'INSPECTION_HOLD', 'EXPIRED', 'COMPLETED', 'CANCELLED'],
          },
          description: {type: 'string'},
          valuation: {type: 'number'},
          expedited: {type: 'boolean'},
          expeditedFee: {type: 'number'},
          feeAmount: {type: 'number'},
          feePaid: {type: 'boolean'},
          submittedAt: {type: 'string', format: 'date-time'},
          createdAt: {type: 'string', format: 'date-time'},
          updatedAt: {type: 'string', format: 'date-time'},
        },
      },
      Inspection: {
        type: 'object',
        properties: {
          id: {type: 'string', format: 'uuid'},
          permitId: {type: 'string', format: 'uuid'},
          type: {type: 'string'},
          status: {type: 'string'},
          result: {type: 'string', enum: ['PASS', 'FAIL', 'PARTIAL']},
          scheduledDate: {type: 'string', format: 'date-time'},
          completedAt: {type: 'string', format: 'date-time'},
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {type: 'string'},
          message: {type: 'string'},
        },
      },
    },
  },
  paths: {
    '/api/v1/permits': {
      get: {
        tags: ['permits'],
        summary: 'List permits',
        security: [{ApiKeyAuth: []}],
        parameters: [
          {name: 'jurisdictionId', in: 'query', schema: {type: 'string'}},
          {name: 'status', in: 'query', schema: {type: 'string'}},
          {name: 'type', in: 'query', schema: {type: 'string'}},
          {name: 'page', in: 'query', schema: {type: 'integer', default: 1}},
          {name: 'limit', in: 'query', schema: {type: 'integer', default: 50}},
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {$ref: '#/components/schemas/Permit'},
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: {type: 'integer'},
                        limit: {type: 'integer'},
                        total: {type: 'integer'},
                        totalPages: {type: 'integer'},
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {$ref: '#/components/responses/Unauthorized'},
          '429': {$ref: '#/components/responses/RateLimitExceeded'},
        },
      },
      post: {
        tags: ['permits'],
        summary: 'Create permit',
        security: [{ApiKeyAuth: []}],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jurisdictionId', 'propertyId', 'type', 'description', 'valuation'],
                properties: {
                  jurisdictionId: {type: 'string'},
                  propertyId: {type: 'string'},
                  type: {type: 'string'},
                  description: {type: 'string'},
                  valuation: {type: 'number'},
                  expedited: {type: 'boolean'},
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {$ref: '#/components/schemas/Permit'},
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/permits/{id}': {
      get: {
        tags: ['permits'],
        summary: 'Get permit',
        security: [{ApiKeyAuth: []}],
        parameters: [
          {name: 'id', in: 'path', required: true, schema: {type: 'string'}},
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {$ref: '#/components/schemas/Permit'},
                  },
                },
              },
            },
          },
          '404': {$ref: '#/components/responses/NotFound'},
        },
      },
    },
  },
  components: {
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: {$ref: '#/components/schemas/Error'},
          },
        },
      },
    },
  },
};
