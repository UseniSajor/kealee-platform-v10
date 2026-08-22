/**
 * Editor route authorization helper.
 *
 * Pascal Editor /api/editor/* routes used to trust a `userId` value supplied
 * in the request body, which let any caller spoof scenes/uploads/renders for
 * any user. This helper derives the authenticated user id from Clerk's
 * verified server request context and gates editor mutations.
 *
 * Behaviour:
 *  - Authenticated user → returns { userId, mode: 'authenticated' }
 *  - Anonymous + ALLOW_ANONYMOUS_EDITOR=true → returns { userId: null, mode: 'anonymous' }
 *  - Anonymous + flag off → returns NextResponse 401, caller short-circuits
 *
 * Default behaviour is anon-allowed (matches the public concept funnel) so the
 * editor remains usable from /editor without auth — but the helper guarantees
 * that authenticated requests always receive a server-derived userId, never
 * a client-supplied one.
 */

import { NextResponse } from 'next/server'
import { getClerkUser } from '@kealee/auth'

export interface EditorAuthOk {
  ok: true
  userId: string | null
  email: string | null
  mode: 'authenticated' | 'anonymous'
}

export interface EditorAuthBlocked {
  ok: false
  response: NextResponse
}

export type EditorAuthResult = EditorAuthOk | EditorAuthBlocked

/** Returns true when the deployment allows anonymous editor access. */
function anonymousAllowed(): boolean {
  // Default: TRUE. Set ALLOW_ANONYMOUS_EDITOR=false to require Clerk login
  // for every /api/editor/* call.
  const raw = process.env.ALLOW_ANONYMOUS_EDITOR
  if (raw == null) return true
  return raw.trim().toLowerCase() !== 'false'
}

/**
 * Derive the caller identity from Clerk's verified request context.
 * Returns either an `ok: true` result with the server-derived `userId` (which
 * is `null` for anonymous callers when allowed), or `ok: false` with a 401
 * response the route handler should return verbatim.
 *
 * Call from a Next.js Route Handler (no `req` argument needed — uses the
 * request-scoped `cookies()` helper).
 */
export async function authorizeEditorRequest(): Promise<EditorAuthResult> {
  try {
    const user = await getClerkUser()
    if (user) {
      return {
        ok:    true,
        userId: user.id,
        email:  user.email,
        mode:   'authenticated',
      }
    }
  } catch (err: any) {
    console.warn('[editor-auth] Clerk session lookup threw:', err?.message)
    // Fall through to anonymous handling
  }

  if (anonymousAllowed()) {
    return { ok: true, userId: null, email: null, mode: 'anonymous' }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  }
}

/**
 * Verify that the authenticated caller (if any) owns the given `ownerUserId`
 * recorded on a scene / upload / render row. Anonymous callers can only
 * touch rows that have `ownerUserId === null`.
 *
 * Returns null when allowed; otherwise a 403/401 NextResponse.
 */
export function enforceOwnership(
  auth: EditorAuthOk,
  ownerUserId: string | null | undefined,
): NextResponse | null {
  if (auth.mode === 'authenticated') {
    if (ownerUserId == null) {
      // Resource was created anonymously; allow the first authenticated user
      // to claim it (matches the migration path from anon → signed-in).
      return null
    }
    if (ownerUserId === auth.userId) return null
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Anonymous caller may only touch anonymous resources.
  if (ownerUserId == null) return null
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
