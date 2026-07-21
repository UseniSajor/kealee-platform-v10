// datadog-api.config.ts
// Datadog APM configuration for API service

import tracer from 'dd-trace';

// Initialize Datadog APM
tracer.init({
  service: process.env.DD_SERVICE || 'kealee-api',
  env: process.env.DD_ENV || process.env.NODE_ENV || 'production',
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
  // Additional options
  tags: {
    environment: process.env.NODE_ENV || 'production',
    version: process.env.DD_VERSION || '1.0.0',
  },
});

export default tracer;
