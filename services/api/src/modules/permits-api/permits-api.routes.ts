/**
 * Permits & Inspections RESTful API Routes
 * Full CRUD for permits, inspections, documents
 */

import {FastifyInstance, FastifyRequest, FastifyReply} from 'fastify';
import {getSupabaseClient} from '../../utils/supabase-client';

interface PermitQuery {
  jurisdictionId?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface PermitParams {
  id: string;
}

export async function permitsApiRoutes(fastify: FastifyInstance) {
  // Use centralized Supabase client (handles missing credentials gracefully)
  const supabase = getSupabaseClient();

  // GET /api/v1/permits - List permits
  fastify.get<{Querystring: PermitQuery}>(
    '/api/v1/permits',
    {
      schema: {
        description: 'List permits with filtering and pagination',
        tags: ['permits'],
        querystring: {
          type: 'object',
          properties: {
            jurisdictionId: {type: 'string'},
            status: {type: 'string'},
            type: {type: 'string'},
            page: {type: 'number', default: 1},
            limit: {type: 'number', default: 50},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {type: 'array'},
              pagination: {
                type: 'object',
                properties: {
                  page: {type: 'number'},
                  limit: {type: 'number'},
                  total: {type: 'number'},
                  totalPages: {type: 'number'},
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{Querystring: PermitQuery}>, reply: FastifyReply) => {
      try {
        const {jurisdictionId, status, type, page = 1, limit = 50} = request.query;

        let query = supabase.from('Permit').select('*', {count: 'exact'});

        if (jurisdictionId) {
          query = query.eq('jurisdictionId', jurisdictionId);
        }
        if (status) {
          query = query.eq('status', status);
        }
        if (type) {
          query = query.eq('type', type);
        }

        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1).order('createdAt', {ascending: false});

        const {data, error, count} = await query;

        if (error) throw error;

        return reply.send({
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        });
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // GET /api/v1/permits/:id - Get permit
  fastify.get<{Params: PermitParams}>(
    '/api/v1/permits/:id',
    {
      schema: {
        description: 'Get permit by ID',
        tags: ['permits'],
        params: {
          type: 'object',
          properties: {
            id: {type: 'string'},
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest<{Params: PermitParams}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;

        const {data, error} = await supabase
          .from('Permit')
          .select('*, documents:PermitDocument(*), reviews:PermitReview(*), inspections:Inspection(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          return reply.status(404).send({error: 'Permit not found'});
        }

        return reply.send({data});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // POST /api/v1/permits - Create permit
  fastify.post(
    '/api/v1/permits',
    {
      schema: {
        description: 'Create new permit',
        tags: ['permits'],
        body: {
          type: 'object',
          required: ['jurisdictionId', 'propertyId', 'type', 'description', 'valuation'],
          properties: {
            jurisdictionId: {type: 'string'},
            propertyId: {type: 'string'},
            type: {type: 'string'},
            description: {type: 'string'},
            valuation: {type: 'number'},
            expedited: {type: 'boolean', default: false},
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const permitData = request.body as any;

        const {data, error} = await supabase
          .from('Permit')
          .insert(permitData)
          .select()
          .single();

        if (error) throw error;

        return reply.status(201).send({data});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // PUT /api/v1/permits/:id - Update permit
  fastify.put<{Params: PermitParams}>(
    '/api/v1/permits/:id',
    {
      schema: {
        description: 'Update permit',
        tags: ['permits'],
        params: {
          type: 'object',
          properties: {
            id: {type: 'string'},
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest<{Params: PermitParams}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;
        const updateData = request.body as any;

        const {data, error} = await supabase
          .from('Permit')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (!data) {
          return reply.status(404).send({error: 'Permit not found'});
        }

        return reply.send({data});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // DELETE /api/v1/permits/:id - Delete permit
  fastify.delete<{Params: PermitParams}>(
    '/api/v1/permits/:id',
    {
      schema: {
        description: 'Delete permit',
        tags: ['permits'],
        params: {
          type: 'object',
          properties: {
            id: {type: 'string'},
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest<{Params: PermitParams}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;

        const {error} = await supabase.from('Permit').delete().eq('id', id);

        if (error) throw error;

        return reply.status(204).send();
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // GET /api/v1/inspections - List inspections
  fastify.get(
    '/api/v1/inspections',
    {
      schema: {
        description: 'List inspections',
        tags: ['inspections'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {data, error} = await supabase
          .from('Inspection')
          .select('*')
          .order('requestedAt', {ascending: false})
          .limit(50);

        if (error) throw error;

        return reply.send({data: data || []});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // GET /api/v1/inspections/:id - Get inspection
  fastify.get<{Params: {id: string}}>(
    '/api/v1/inspections/:id',
    {
      schema: {
        description: 'Get inspection by ID',
        tags: ['inspections'],
      },
    },
    async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
      try {
        const {id} = request.params;

        const {data, error} = await supabase
          .from('Inspection')
          .select('*, permit:Permit(*), corrections:InspectionCorrection(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          return reply.status(404).send({error: 'Inspection not found'});
        }

        return reply.send({data});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );

  // POST /api/v1/documents - Upload document
  fastify.post(
    '/api/v1/documents',
    {
      schema: {
        description: 'Upload document',
        tags: ['documents'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const documentData = request.body as any;

        const {data, error} = await supabase
          .from('PermitDocument')
          .insert(documentData)
          .select()
          .single();

        if (error) throw error;

        return reply.status(201).send({data});
      } catch (error: any) {
        return reply.status(500).send({error: error.message});
      }
    }
  );
}
