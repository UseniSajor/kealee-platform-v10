import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function authMiddleware(req: NextRequest) {
  const res = NextResponse.next();
  // Use type assertion to avoid version conflicts between Next.js types
  const supabase = createMiddlewareClient({ req, res } as unknown as Parameters<typeof createMiddlewareClient>[0]);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { session, response: res };
}
