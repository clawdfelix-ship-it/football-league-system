import { withAuth } from 'next-auth/middleware';

/**
 * Middleware to enforce password change on first login.
 *
 * If the session has `mustChangePassword: true`, redirect to /change-password
 * unless the user is already on /change-password or /login.
 *
 * Admin sessions bypass this — admins don't have a must-change flag.
 */
export default withAuth(
  function middleware(req) {
    const must = req.nextauth.token?.mustChangePassword;
    const path = req.nextUrl.pathname;
    if (
      must &&
      !path.startsWith('/change-password') &&
      !path.startsWith('/login') &&
      !path.startsWith('/api/auth')
    ) {
      const url = req.nextUrl.clone();
      url.pathname = '/change-password';
      url.search = '';
      return Response.redirect(url);
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export const config = {
  // Run on all pages except static assets, _next internals, and the public api endpoints.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|login|change-password).*)'],
};