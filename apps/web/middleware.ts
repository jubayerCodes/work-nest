import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/invite'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public auth pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // wn_auth is a web-domain indicator cookie set by auth.store after login/register.
  // access_token is httpOnly on the API domain and invisible to this middleware in
  // cross-domain deployments (e.g. Render). We use wn_auth for routing decisions.
  const wnAuth = req.cookies.get('wn_auth')?.value;
  const accessToken = req.cookies.get('access_token')?.value;

  // Neither cookie present → definitely not logged in
  if (!wnAuth && !accessToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth indicator present — allow through.
  // The dashboard layout calls /auth/me for real server-side validation.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
