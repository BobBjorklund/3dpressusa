import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { key } = await req.json();

  if (typeof key !== 'string' || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return res;
}
