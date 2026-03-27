import { auth } from './auth';

export default auth((req) => {
  if (process.env.AUTH_ENABLED !== 'true') return; // auth disabled — allow all requests through

  const { pathname } = req.nextUrl;
  const isPublic = pathname.startsWith('/api/auth') || pathname === '/login';
  if (!req.auth && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
