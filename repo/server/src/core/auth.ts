
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bearerAuthPlugin from '@fastify/bearer-auth';

const VALID_API_KEYS = new Set([
    'kealee_sk_live_12345', // Example Production Key
    'kealee_sk_test_67890', // Example Test Key
    'frontend_service_key',  // Internal key for the Command Center UI
]);

export async function registerAuth(fastify: FastifyInstance) {
    await fastify.register(bearerAuthPlugin, {
        keys: VALID_API_KEYS,
        errorResponse: (err) => {
            return { error: 'Unauthorized: Invalid or missing API Key' };
        },
        auth: (key, req) => {
            // In a real app, you would look up the key in the database
            // and check rate limits here.
            return VALID_API_KEYS.has(key);
        },
    });

    // Protect all API routes
    fastify.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/api/v1')) {
            //bearer-auth plugin handles the verification automatically if registered on routes
            // But since we want to apply it globally for /api/v1, checking if verifying works
        }
    });
}
