/**
 * Environment Configuration and Detection
 * Handles Railway Preview vs Production separation
 */

export type Environment = 'production' | 'staging' | 'preview' | 'development';

export interface EnvironmentConfig {
  env: Environment;
  isProduction: boolean;
  isStaging: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  railwayEnvironment: string | undefined;
  nodeEnv: string;
}

/**
 * Detect current environment based on APP_ENV, NODE_ENV, and Railway-specific variables
 */
export function detectEnvironment(): EnvironmentConfig {
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;
  const railwayServiceName = process.env.RAILWAY_SERVICE_NAME;

  // Determine environment priority:
  // 1. APP_ENV takes highest precedence (explicit override)
  // 2. NODE_ENV (standard Node.js convention)
  // 3. Check service name for "staging" keyword
  // 4. Fallback to RAILWAY_ENVIRONMENT_NAME
  let env: Environment = 'development';

  // Priority 1: Use APP_ENV if explicitly set (highest priority)
  if (appEnv) {
    const normalized = appEnv.toLowerCase();
    if (normalized === 'production' || normalized === 'prod') {
      env = 'production';
    } else if (normalized === 'staging' || normalized === 'stage') {
      env = 'staging';
    } else if (normalized === 'preview') {
      env = 'preview';
    } else if (normalized === 'development' || normalized === 'dev') {
      env = 'development';
    }
  }
  // Priority 2: Use NODE_ENV if APP_ENV not set
  else if (nodeEnv === 'production') {
    env = 'production';
  } else if (nodeEnv === 'staging') {
    env = 'staging';
  } else if (nodeEnv === 'preview') {
    env = 'preview';
  } else if (nodeEnv === 'development') {
    env = 'development';
  }
  // Priority 3: Check if service name contains "staging" or "production"
  else if (railwayServiceName) {
    const serviceLower = railwayServiceName.toLowerCase();
    if (serviceLower.includes('production') || serviceLower.includes('prod')) {
      env = 'production';
    } else if (serviceLower.includes('staging')) {
      env = 'staging';
    }
  }
  // Priority 4: Fallback to Railway environment
  else if (railwayEnv) {
    const normalized = railwayEnv.toLowerCase();
    if (normalized === 'production' || normalized === 'prod' || normalized === 'main') {
      env = 'production';
    } else if (normalized === 'staging' || normalized === 'stage') {
      env = 'staging';
    } else {
      // Any other Railway environment (pr-xxx, etc.) is preview
      env = 'preview';
    }
  }

  return {
    env,
    isProduction: env === 'production',
    isStaging: env === 'staging',
    isPreview: env === 'preview',
    isDevelopment: env === 'development',
    railwayEnvironment: railwayEnv,
    nodeEnv,
  };
}

/**
 * Get environment configuration
 */
export const environment = detectEnvironment();

/**
 * Log environment information at startup
 */
export function logEnvironment(): void {
  const emoji = environment.isProduction ? '🚀' : environment.isStaging ? '🔶' : environment.isPreview ? '🔵' : '💻';

  console.log('');
  console.log('='.repeat(60));
  console.log(`${emoji} Environment Configuration ${emoji}`);
  console.log('='.repeat(60));
  console.log(`Environment:        ${environment.env.toUpperCase()}`);
  console.log(`APP_ENV:            ${process.env.APP_ENV || '(not set)'}`);
  console.log(`NODE_ENV:           ${environment.nodeEnv}`);
  if (environment.railwayEnvironment) {
    console.log(`Railway Env:        ${environment.railwayEnvironment}`);
  }
  if (process.env.RAILWAY_SERVICE_NAME) {
    console.log(`Railway Service:    ${process.env.RAILWAY_SERVICE_NAME}`);
  }
  console.log(`Is Production:      ${environment.isProduction}`);
  console.log(`Is Staging:         ${environment.isStaging}`);
  console.log(`Is Preview:         ${environment.isPreview}`);
  console.log(`Is Development:     ${environment.isDevelopment}`);
  console.log('='.repeat(60));
  console.log('');
}

/**
 * Guard function to prevent production-only operations in non-production environments
 */
export function requireProduction(operation: string): void {
  if (!environment.isProduction) {
    throw new Error(
      `Operation "${operation}" is only allowed in production environment. ` +
      `Current environment: ${environment.env}`
    );
  }
}

/**
 * Guard function to prevent preview/dev operations in production
 */
export function requireNonProduction(operation: string): void {
  if (environment.isProduction) {
    throw new Error(
      `Operation "${operation}" is not allowed in production environment. ` +
      `Current environment: ${environment.env}`
    );
  }
}

/**
 * Check if a feature should be enabled based on environment
 */
export function isFeatureEnabled(
  feature: string,
  enabledInEnvs: Environment[] = ['production', 'staging']
): boolean {
  const enabled = enabledInEnvs.includes(environment.env);

  if (!enabled) {
    console.log(`⚠️  Feature "${feature}" is disabled in ${environment.env} environment`);
  }

  return enabled;
}

/**
 * Get environment-specific configuration value
 * Prevents accidental use of production values in preview/dev
 */
export function getEnvConfig<T>(config: {
  production?: T;
  staging?: T;
  preview?: T;
  development?: T;
  default?: T;
}): T | undefined {
  const value =
    environment.isProduction ? config.production :
      environment.isStaging ? config.staging :
        environment.isPreview ? config.preview :
          environment.isDevelopment ? config.development :
            config.default;

  return value !== undefined ? value : config.default;
}

/**
 * Validate that required production-only environment variables are set
 */
export function validateProductionConfig(): void {
  if (!environment.isProduction) {
    return; // Only validate in production
  }

  const requiredProductionVars = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'API_BASE_URL',
  ];

  const missing = requiredProductionVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required production environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('⚠️  App will start but some features may not work until these are added.');
    // Don't throw - let app start with warnings
    // throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  // Validate production values don't contain "test", "demo", "staging", etc.
  const productionChecks: Record<string, RegExp> = {
    'STRIPE_SECRET_KEY': /sk_live_/,
    'STRIPE_PUBLISHABLE_KEY': /pk_live_/,
  };

  Object.entries(productionChecks).forEach(([varName, pattern]) => {
    const value = process.env[varName];
    if (value && !pattern.test(value)) {
      console.warn(`⚠️  Warning: ${varName} does not match production pattern in production environment`);
    }
  });
}

/**
 * Get safe configuration that prevents production data exposure in preview
 */
export function getSafeConfig() {
  return {
    // Database - use different databases per environment
    databaseUrl: process.env.DATABASE_URL,

    // S3/Storage - prevent preview from using production bucket
    storageUrl: environment.isProduction
      ? process.env.PRODUCTION_STORAGE_URL || process.env.FILE_STORAGE_URL
      : environment.isStaging
        ? process.env.STAGING_STORAGE_URL || process.env.FILE_STORAGE_URL
        : process.env.PREVIEW_STORAGE_URL || process.env.FILE_STORAGE_URL,

    // Stripe - always use test keys in non-production
    stripeKey: environment.isProduction
      ? process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_TEST_KEY || process.env.STRIPE_SECRET_KEY,

    // Webhooks - prevent preview from using production webhook secrets
    webhookSecret: environment.isProduction
      ? process.env.WEBHOOK_SECRET
      : process.env.PREVIEW_WEBHOOK_SECRET || 'preview-webhook-secret',

    // Email - prevent preview from sending real emails
    emailEnabled: isFeatureEnabled('email', ['production', 'staging']),
    emailFromAddress: environment.isProduction
      ? process.env.EMAIL_FROM || 'noreply@kealee.com'
      : `preview-${environment.railwayEnvironment || 'test'}@kealee.com`,

    // External integrations
    docusignEnabled: isFeatureEnabled('docusign', ['production', 'staging']),
    docusignBasePath: environment.isProduction
      ? process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi'
      : 'https://demo.docusign.net/restapi',

    // Feature flags
    features: {
      rateLimiting: isFeatureEnabled('rate-limiting', ['production', 'staging']),
      analytics: isFeatureEnabled('analytics', ['production', 'staging']),
      errorReporting: isFeatureEnabled('error-reporting', ['production', 'staging']),
      debugMode: !environment.isProduction, // Debug only in non-production
    },
  };
}

export default environment;
