/**
 * Production Configuration for Kealee Platform
 *
 * This configuration file contains all production-specific settings
 * for deploying the Kealee Command Center platform.
 */

export const productionConfig = {
  // ============ Environment ============
  environment: 'production' as const,
  debug: false,
  logLevel: 'info' as const,

  // ============ API Configuration ============
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.kealee.com',
    version: 'v1',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // ============ Database Configuration ============
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    name: process.env.DATABASE_NAME || 'kealee_production',
    user: process.env.DATABASE_USER || 'kealee',
    password: process.env.DATABASE_PASSWORD,
    ssl: true,
    poolMin: 5,
    poolMax: 20,
    idleTimeout: 30000,
    connectionTimeout: 10000,
  },

  // ============ Redis Configuration ============
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: true,
    maxRetries: 3,
    retryDelay: 1000,
  },

  // ============ Stripe Configuration ============
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    apiVersion: '2023-10-16' as const,
    // Platform commission rate (3.5%)
    platformCommissionRate: 0.035,
  },

  // ============ Authentication ============
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // ============ Rate Limiting ============
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: {
      default: 100,
      payment: 10,
      sensitive: 5,
      auth: 10,
    },
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
  },

  // ============ Security Headers ============
  security: {
    helmet: true,
    cors: {
      origin: [
        'https://kealee.com',
        'https://www.kealee.com',
        'https://app.kealee.com',
        'https://portal.kealee.com',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // ============ Feature Flags ============
  featureFlags: {
    // Module rollout configuration
    modules: {
      'm-ops-services': { enabled: true, rollout: 100 },
      'm-permits-inspections': { enabled: true, rollout: 100 },
      'm-project-owner': { enabled: true, rollout: 100 },
      'm-architect': { enabled: true, rollout: 100 },
      'm-finance-trust': { enabled: true, rollout: 100 },
      'm-marketplace': { enabled: true, rollout: 50 }, // Beta at 50%
      'm-engineer': { enabled: true, rollout: 25 }, // Beta at 25%
      'm-command-center': { enabled: true, rollout: 100 },
    },
    // Feature-specific flags
    features: {
      preConWorkflow: true,
      estimationEngine: true,
      escrowPayments: true,
      stripeConnect: true,
      advancedReporting: false, // Coming soon
      aiAssistant: false, // Coming soon
    },
  },

  // ============ Email Configuration ============
  email: {
    provider: 'sendgrid' as const,
    apiKey: process.env.SENDGRID_API_KEY,
    fromAddress: 'noreply@kealee.com',
    fromName: 'Kealee Platform',
    templates: {
      welcome: 'd-xxxxx',
      passwordReset: 'd-xxxxx',
      invoicePaid: 'd-xxxxx',
      paymentFailed: 'd-xxxxx',
      milestoneApproved: 'd-xxxxx',
      disputeCreated: 'd-xxxxx',
    },
  },

  // ============ File Storage ============
  storage: {
    provider: 's3' as const,
    bucket: process.env.S3_BUCKET || 'kealee-production',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cdnUrl: process.env.CDN_URL || 'https://cdn.kealee.com',
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },

  // ============ Monitoring ============
  monitoring: {
    // Error tracking
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
    },
    // Application Performance Monitoring
    apm: {
      enabled: true,
      serviceName: 'kealee-api',
      serverUrl: process.env.APM_SERVER_URL,
    },
    // Logging
    logging: {
      level: 'info',
      format: 'json',
      destination: 'cloudwatch',
    },
  },

  // ============ Caching ============
  cache: {
    enabled: true,
    ttl: {
      default: 300, // 5 minutes
      static: 3600, // 1 hour
      user: 60, // 1 minute
      pricing: 300, // 5 minutes
    },
  },

  // ============ Payment Processing ============
  payments: {
    // Platform fees
    platformCommission: 0.035, // 3.5%
    // Processing fees (passed to customer)
    cardFeePercent: 0.029, // 2.9%
    cardFeeFlat: 0.30, // $0.30
    achFee: 0, // No fee for ACH
    wireFee: 25, // $25 for wire transfers
    // Escrow settings
    escrow: {
      holdPeriodDays: 7, // Days before auto-release
      disputeWindowDays: 14,
      maxMilestones: 10,
    },
  },

  // ============ Application URLs ============
  urls: {
    marketing: 'https://kealee.com',
    app: 'https://app.kealee.com',
    api: 'https://api.kealee.com',
    portal: 'https://portal.kealee.com',
    docs: 'https://docs.kealee.com',
    support: 'https://support.kealee.com',
  },
};

// ============ Environment Validation ============
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = [
    'DATABASE_PASSWORD',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SENDGRID_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ============ Export for different environments ============
export default productionConfig;
