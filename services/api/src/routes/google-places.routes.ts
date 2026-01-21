/**
 * Google Places API Routes
 * Handles address autocomplete, place details, geocoding, and jurisdiction detection
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  autocompleteAddresses,
  getPlaceDetails,
  geocodeAddress,
  detectJurisdiction,
  reverseGeocode,
} from '../services/google-places.service';

const autocompleteSchema = z.object({
  input: z.string().min(1).max(200),
  sessionToken: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  radius: z.number().int().positive().max(50000).optional(),
});

const placeDetailsSchema = z.object({
  placeId: z.string().min(1),
  sessionToken: z.string().optional(),
  fields: z.array(z.string()).optional(),
});

const geocodeSchema = z.object({
  address: z.string().min(1).max(500),
});

const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function googlePlacesRoutes(fastify: FastifyInstance) {
  
  // POST /api/google-places/autocomplete - Address autocomplete
  fastify.post(
    '/autocomplete',
    {
      preHandler: [authenticateUser, validateBody(autocompleteSchema)],
      schema: {
        description: 'Get address autocomplete suggestions',
        tags: ['google-places'],
        response: {
          200: {
            type: 'object',
            properties: {
              predictions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    placeId: { type: 'string' },
                    description: { type: 'string' },
                    mainText: { type: 'string' },
                    secondaryText: { type: 'string' },
                    types: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { input, sessionToken, location, radius } = autocompleteSchema.parse(request.body);

        const predictions = await autocompleteAddresses(input, sessionToken, location, radius);

        return { predictions };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to autocomplete addresses',
        });
      }
    }
  );

  // POST /api/google-places/place-details - Get place details
  fastify.post(
    '/place-details',
    {
      preHandler: [authenticateUser, validateBody(placeDetailsSchema)],
      schema: {
        description: 'Get detailed information about a place',
        tags: ['google-places'],
      },
    },
    async (request, reply) => {
      try {
        const { placeId, sessionToken, fields } = placeDetailsSchema.parse(request.body);

        const placeDetails = await getPlaceDetails(placeId, sessionToken, fields);

        return { placeDetails };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to get place details',
        });
      }
    }
  );

  // POST /api/google-places/geocode - Geocode address
  fastify.post(
    '/geocode',
    {
      preHandler: [authenticateUser, validateBody(geocodeSchema)],
      schema: {
        description: 'Convert address to coordinates',
        tags: ['google-places'],
      },
    },
    async (request, reply) => {
      try {
        const { address } = geocodeSchema.parse(request.body);

        const result = await geocodeAddress(address);

        return { result };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to geocode address',
        });
      }
    }
  );

  // POST /api/google-places/reverse-geocode - Reverse geocode
  fastify.post(
    '/reverse-geocode',
    {
      preHandler: [authenticateUser, validateBody(reverseGeocodeSchema)],
      schema: {
        description: 'Convert coordinates to address',
        tags: ['google-places'],
      },
    },
    async (request, reply) => {
      try {
        const { lat, lng } = reverseGeocodeSchema.parse(request.body);

        const result = await reverseGeocode(lat, lng);

        return { result };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to reverse geocode',
        });
      }
    }
  );

  // POST /api/google-places/detect-jurisdiction - Detect jurisdiction from address
  fastify.post(
    '/detect-jurisdiction',
    {
      preHandler: [authenticateUser, validateBody(geocodeSchema)],
      schema: {
        description: 'Detect jurisdiction (city, county, state) from address',
        tags: ['google-places'],
      },
    },
    async (request, reply) => {
      try {
        const { address } = geocodeSchema.parse(request.body);

        const jurisdiction = await detectJurisdiction(address);

        return { jurisdiction };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to detect jurisdiction',
        });
      }
    }
  );
}

