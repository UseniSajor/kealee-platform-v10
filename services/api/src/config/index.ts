/**
 * Centralized Configuration
 * Loads and validates all environment variables
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env.local in development
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: resolve(process.cwd(), '.env.local') });
  // Also load database .env
  dotenvConfig({ path: resolve(process.cwd(), '../../packages/database/.env'), override: true });
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // Supabase (optional - can use S3/R2 instead)
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  
  // S3/R2
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
  s3Bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET!,
  s3Endpoint: process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT!,
  s3Region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
  
  // AI
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514', // Latest recommended: claude-sonnet-4-20250514 or claude-opus-4-20250514 for complex tasks
  
  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY!,
  emailFrom: process.env.EMAIL_FROM || 'noreply@kealee.com',
  
  // Google
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  
  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  
  // JWT (if needed)
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  
  // API
  apiBaseUrl: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

// Validate required env vars in production
const required = [
  'DATABASE_URL',
];

if (process.env.NODE_ENV === 'production') {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
} else {
  // Warn in development if missing optional integrations
  const optional = [
    { key: 'SUPABASE_URL', desc: 'Supabase storage (can use S3/R2 instead)' },
    { key: 'STRIPE_SECRET_KEY', desc: 'Stripe payments' },
  ];
  
  const missing = optional.filter(item => !process.env[item.key]);
  if (missing.length > 0) {
    console.warn('⚠️  Missing optional environment variables:', missing.map(m => `${m.key} (${m.desc})`).join(', '));
  }
}

