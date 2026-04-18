// Fastify auth
export { authPlugin, authenticate, requireRole } from './fastify-auth'
export type { AuthUser } from './fastify-auth'

// Supabase client and auth functions
export {
  supabase,
  signUp,
  signIn,
  signInWithOAuth,
  signOut,
  getSession,
  getCurrentUser,
  verifyOtp,
  resetPassword,
  updatePassword,
  updateUserMetadata,
  onAuthStateChange
} from './supabase-client'

// Session management
export {
  createServerSupabaseClient,
  getServerUser,
  getServerSession,
  requireServerAuth,
  getUserWithProfile,
  requireRole as requireRoleDb,
  serverSignOut,
  createUserProfile,
  updateUserProfile
} from './session-manager'

// Middleware
export { middleware, config } from './middleware'
