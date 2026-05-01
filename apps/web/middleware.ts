import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/invite'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public auth pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;

  // Both tokens missing → definitely not logged in
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token missing but refresh token present → try a silent refresh
  if (!accessToken && refreshToken) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    try {
      const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${refreshToken}` },
      });

      if (!refreshRes.ok) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Forward the new cookies from the API and continue
      const response = NextResponse.next();
      const setCookie = refreshRes.headers.get('set-cookie');
      if (setCookie) response.headers.set('set-cookie', setCookie);
      return response;
    } catch {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Access token cookie is present — allow through.
  // The dashboard layout calls /auth/me to do real server-side validation.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
