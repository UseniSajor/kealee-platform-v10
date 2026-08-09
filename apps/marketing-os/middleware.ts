import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ROLES = new Set(['admin', 'super_admin', 'marketing_admin'])

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = new URL(process.env.MARKETING_OS_LOGIN_URL ?? '/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  const role = String(user.app_metadata?.role ?? '').toLowerCase()
  if (!ALLOWED_ROLES.has(role)) return NextResponse.redirect(new URL('/unauthorized', request.url))
  return response
}

export const config = {
  matcher: ['/((?!login|unauthorized|guides|sitemap.xml|robots.txt|api/health|api/webhooks|_next/static|_next/image|favicon.ico).*)'],
}
