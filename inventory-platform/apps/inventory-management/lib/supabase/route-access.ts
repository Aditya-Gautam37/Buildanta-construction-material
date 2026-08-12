// Pure routing decision, deliberately separated from Next's proxy/middleware
// plumbing and the Supabase client so the security-critical part — who gets
// redirected where — can be unit tested directly, without mocking either.
export const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/fast', '/access-denied'];
const AUTH_ROUTES = ['/login', '/signup'];

export type RouteAccessInput = {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
  needsProfileCompletion: boolean;
  /** The current URL's own ?redirect= param, if any (only relevant on an auth route). */
  existingRedirectParam: string | null;
};

/** Returns the path (with query string) to redirect to, or null to let the request through. */
export function resolveRouteAccess({ pathname, search, isAuthenticated, needsProfileCompletion, existingRedirectParam }: RouteAccessInput): string | null {
  // Default-deny: every admin page requires a signed-in user unless its path
  // is explicitly listed as public. This used to be the other way around —
  // an allowlist of *protected* prefixes — which meant a new admin page was
  // reachable by anyone unless someone remembered to add it to that list.
  const isProtectedRoute = !PUBLIC_ROUTES.some((path) => pathname.startsWith(path));
  const isAuthRoute = AUTH_ROUTES.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && isAuthenticated && needsProfileCompletion && pathname !== '/profile/complete') {
    return `/profile/complete?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
  }
  if (isProtectedRoute && !isAuthenticated) {
    return `/login?redirect=${encodeURIComponent(pathname)}`;
  }
  if (isAuthRoute && isAuthenticated && needsProfileCompletion) {
    return `/profile/complete?redirect=${encodeURIComponent(existingRedirectParam || '/dashboard')}`;
  }
  if (isAuthRoute && isAuthenticated) {
    return '/dashboard';
  }
  return null;
}
