import { withAuth } from 'next-auth/middleware';
import { NextURL } from 'next/dist/server/web/next-url';

/**
 * Route protection.
 *
 * Public pages (home/standings, fixtures, teams, players, scorers, overview,
 * head-to-head, contacts, register, pdf) are viewable by anyone — this is a
 * league site where fans/managers check standings without logging in.
 *
 * Protected pages are the admin/manager dashboards and account/setup areas.
 * The matcher below gates ONLY those; everything else is open.
 *
 * Additionally, any signed-in user flagged mustChangePassword is redirected
 * to /change-password until they set their own password.
 */
const PROTECTED_PREFIXES = [
  '/admin',
  '/manager-dashboard',
  '/dashboard',
  '/team-settings',
  '/init-teams',
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Enforce forced password change for signed-in users on protected routes.
    const must = token?.mustChangePassword;
    if (
      token &&
      must &&
      isProtected(path) &&
      !path.startsWith('/change-password')
    ) {
      const url = req.nextUrl.clone();
      url.pathname = '/change-password';
      url.search = '';
      return Response.redirect(url);
    }
    return undefined;
  },
  {
    callbacks: {
      // Only require a session on the protected admin/manager pages.
      authorized: ({ token, req }) => {
        const path = (req.nextUrl as NextURL).pathname;
        if (!isProtected(path)) return true;
        return Boolean(token);
      },
    },
  }
);

export const config = {
  // Run on all pages except static assets, _next internals, and auth endpoints.
  // The authorized callback decides whether each page actually needs a session.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
