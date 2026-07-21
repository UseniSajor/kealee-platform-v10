/**
 * Editor route authorization helper.
 *
 * Pascal Editor /api/editor/* routes used to trust a `userId` value supplied
 * in the request body, which let any caller spoof scenes/uploads/renders for
 * any user. This helper derives the authenticated user id from the Supabase
 * auth cookie server-side and gates editor mutations.
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
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

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
  // Default: TRUE. Set ALLOW_ANONYMOUS_EDITOR=false to require Supabase login
  // for every /api/editor/* call.
  const raw = process.env.ALLOW_ANONYMOUS_EDITOR
  if (raw == null) return true
  return raw.trim().toLowerCase() !== 'false'
}

/**
 * Derive the caller identity from the Supabase auth cookie.
 * Returns either an `ok: true` result with the server-derived `userId` (which
 * is `null` for anonymous callers when allowed), or `ok: false` with a 401
 * response the route handler should return verbatim.
 *
 * Call from a Next.js Route Handler (no `req` argument needed — uses the
 * request-scoped `cookies()` helper).
 */
export async function authorizeEditorRequest(): Promise<EditorAuthResult> {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Without Supabase env vars we cannot verify; fail closed unless anon mode.
  if (!supabaseUrl || !supabaseAnon) {
    return anonymousAllowed()
      ? { ok: true, userId: null, email: null, mode: 'anonymous' }
      : { ok: false, response: NextResponse.json({ error: 'Auth not configured' }, { status: 500 }) }
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.warn('[editor-auth] getSession failed:', error.message)
      return anonymousAllowed()
        ? { ok: true, userId: null, email: null, mode: 'anonymous' }
        : { ok: false, response: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }) }
    }

    if (session?.user) {
      return {
        ok:    true,
        userId: session.user.id,
        email:  session.user.email ?? null,
        mode:   'authenticated',
      }
    }
  } catch (err: any) {
    console.warn('[editor-auth] cookie/session lookup threw:', err?.message)
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
