import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  const expected = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.DASHBOARD_COOKIE_SECRET;

  if (!expected || !secret) {
  return NextResponse.json({ 
    error: 'server misconfigured', 
    hasExpected: !!expected, 
    hasSecret: !!secret 
  }, { status: 500 });
}

  if (password !== expected) {
    // small delay to slow brute force
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('evelyn_auth', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  return res;
}