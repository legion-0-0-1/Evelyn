import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'evelyn_auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths — never gated
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/telegram') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.DASHBOARD_COOKIE_SECRET;

  if (!expected || cookie !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};