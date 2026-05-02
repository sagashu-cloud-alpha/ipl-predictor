import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session and get user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/app']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Allow the callback route for auth
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  if (!user && isProtectedPath) {
    // No user, redirect to login with return URL
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    const redirectResponse = NextResponse.redirect(url)
    // Prevent caching of redirect responses
    redirectResponse.headers.set('Cache-Control', 'no-store, max-age=0')
    return redirectResponse
  }

  // Add cache control for protected routes to prevent back button issues
  if (user && isProtectedPath) {
    supabaseResponse.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  }

  return supabaseResponse
}
