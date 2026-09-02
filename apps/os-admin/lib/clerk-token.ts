/**
 * Session token for os-admin's client-side API callers.
 *
 * This is a BROWSER helper. It used to be isomorphic — branching on
 * `typeof window` and dynamically importing `@clerk/nextjs/server` on the
 * server side — and that broke the build:
 *
 *     'server-only' cannot be imported from a Client Component module.
 *     The error was caused by importing '@clerk/nextjs/dist/esm/server/index.js'
 *     in './lib/clerk-token.ts'
 *
 * A `typeof window` guard is a runtime check; the bundler resolves the import
 * regardless and pulls Clerk's server entry into the client graph, where
 * `server-only` refuses to load. Every caller in this app is a client
 * component — `lib/api.ts`, `lib/api/client.ts`, `lib/claws.ts`,
 * `lib/os-admin-api.service.ts`, `lib/api/admin-client.ts` and the two pages
 * that use them — so the server branch was unreachable code that cost the app
 * its build.
 *
 * Server code should call `auth()` from `@clerk/nextjs/server` directly rather
 * than route through here.
 */
export async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    // Loud rather than a silent null: a server caller that quietly received no
    // token would produce an unauthenticated request and a confusing 401 far
    // from the cause.
    throw new Error(
      'getClerkToken() is a browser helper. On the server, call auth() from ' +
      '@clerk/nextjs/server directly — importing it here puts a server-only ' +
      'module in the client bundle.',
    )
  }

  const clerk = (window as typeof window & {
    Clerk?: { session?: { getToken: () => Promise<string | null> } }
  }).Clerk
  return await clerk?.session?.getToken() ?? null
}
