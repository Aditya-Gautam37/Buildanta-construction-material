import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveRouteAccess } from './route-access';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Role-specific checks (Admin/Finance-only actions, etc.) are unaffected by
  // this: they still happen per-page via requireStaffAccess({ allowedRoles }).
  const redirectTo = resolveRouteAccess({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isAuthenticated: Boolean(user),
    needsProfileCompletion: !user?.user_metadata?.firstName || !user?.user_metadata?.lastName,
    existingRedirectParam: request.nextUrl.searchParams.get('redirect'),
  });

  if (redirectTo) return NextResponse.redirect(new URL(redirectTo, request.url));
  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)'],
};
