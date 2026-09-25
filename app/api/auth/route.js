import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema } from '../../../lib/db';
import { setSessionCookie } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  const pin = (body.pin || '').trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'e-mail inválido' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'o pin precisa ter 4 números' }, { status: 400 });
  }

  const existing = await sql`SELECT * FROM users WHERE email = ${email}`;

  let user;
  if (existing.rows.length === 0) {
    const pinHash = await bcrypt.hash(pin, 10);
    const inserted = await sql`
      INSERT INTO users (email, pin_hash)
      VALUES (${email}, ${pinHash})
      RETURNING *
    `;
    user = inserted.rows[0];
  } else {
    user = existing.rows[0];
    const ok = await bcrypt.compare(pin, user.pin_hash);
    if (!ok) {
      return NextResponse.json({ error: 'e-mail ou pin errado' }, { status: 401 });
    }
  }

  const res = NextResponse.json({
    ok: true,
    streak: user.streak,
    best: user.best
  });
  setSessionCookie(res, { uid: user.id, email: user.email });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lilie_session', '', { path: '/', maxAge: 0 });
  return res;
}
