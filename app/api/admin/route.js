import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../lib/db';
import { setAdminCookie, getAdminFromCookies } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const password = body.password || '';

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'senha errada' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}

export async function GET() {
  await ensureSchema();
  if (!getAdminFromCookies()) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  }

  const result = await sql`
    SELECT email, streak, best, last_result_date, last_result, created_at
    FROM users
    ORDER BY streak DESC, best DESC, email ASC
  `;

  return NextResponse.json({ users: result.rows });
}
