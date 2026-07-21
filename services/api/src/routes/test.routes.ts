import { FastifyPluginAsync } from 'fastify';
import * as Sentry from '@sentry/node';

const testRoutes: FastifyPluginAsync = async (fastify) => {
  // Block test routes in production
  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production'
  if (isProduction) {
    fastify.get('/test-sentry', async (_request, reply) => {
      return reply.code(404).send({ error: 'Not found' })
    })
    fastify.get('/test-sentry/database-error', async (_request, reply) => {
      return reply.code(404).send({ error: 'Not found' })
    })
    fastify.get('/test-sentry/payment-error', async (_request, reply) => {
      return reply.code(404).send({ error: 'Not found' })
    })
    fastify.log.info('🔒 Test routes disabled in production')
    return
  }

  // Test Sentry error capture
  fastify.get('/test-sentry', async (request, reply) => {
    try {
      fastify.log.info('🧪 Testing Sentry error capture...');
      
      // Create test error
      const error = new Error('🧪 Sentry Test Error - Backend API is working!');
      
      // Add context for better debugging
      Sentry.setContext('test_info', {
        timestamp: new Date().toISOString(),
        environment: process.env.APP_ENV || process.env.NODE_ENV,
        message: 'This is a deliberate test error to verify Sentry integration',
        endpoint: '/api/test-sentry',
      });
      
      // Add tags
      Sentry.setTag('test_type', 'manual');
      Sentry.setTag('component', 'test_routes');
      
      // Capture the error
      Sentry.captureException(error);
      
      fastify.log.info('✅ Test error sent to Sentry');
      
      return reply.send({
        success: true,
        message: 'Test error sent to Sentry successfully!',
        instructions: 'Check your Sentry dashboard at https://sentry.io',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error({ error }, '❌ Failed to send test error to Sentry');
      Sentry.captureException(error);
      return reply.code(500).send({
        success: false,
        error: 'Test failed',
      });
    }
  });

  // Test successful operation (no error)
  fastify.get('/health', async (request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.APP_ENV || process.env.NODE_ENV,
      sentry_enabled: !!process.env.SENTRY_DSN,
    });
  });

  // Test different error types
  fastify.get('/test-sentry/database-error', async (request, reply) => {
    const error = new Error('Database connection failed - Test error');
    Sentry.setTag('error_type', 'database');
    Sentry.captureException(error);
    
    return reply.send({
      success: true,
      message: 'Database error test sent to Sentry',
    });
  });

  fastify.get('/test-sentry/payment-error', async (request, reply) => {
    const error = new Error('Payment processing failed - Test error');
    Sentry.setTag('error_type', 'payment');
    Sentry.setContext('payment_info', {
      amount: 1000,
      currency: 'USD',
      status: 'failed',
    });
    Sentry.captureException(error);
    
    return reply.send({
      success: true,
      message: 'Payment error test sent to Sentry',
    });
  });
};

export default testRoutes;
