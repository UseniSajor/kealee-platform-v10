// Re-export auth middleware for cleaner imports
export { authenticateUser, AuthenticatedRequest, AuthenticatedUser, requireRole, requireAdmin, requirePM } from './auth.middleware';

// Alias for backwards compatibility
export { authenticateUser as authenticateRequest } from './auth.middleware';
