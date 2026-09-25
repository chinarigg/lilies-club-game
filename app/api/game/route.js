import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../lib/db';
import { getSessionFromCookies } from '../../../lib/auth';
import { syncDailyState, publicView } from '../../../lib/gameState';
import { getDailyPokemon, normalize, todayStr, MAX_ATTEMPTS } from '../../../lib/pokemon';

export const dynamic = 'force-dynamic';

async function loadUser(session) {
  const result = await sql`SELECT * FROM users WHERE id = ${session.uid}`;
  return result.rows[0] || null;
}

export async function GET() {
  await ensureSchema();
  const session = getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  let user = await loadUser(session);
  if (!user) return NextResponse.json({ error: 'usuário não encontrado' }, { status: 404 });

  user = await syncDailyState(user);

  const today = todayStr();
  const finishedToday = user.last_result_date && String(user.last_result_date).slice(0, 10) === today;

  let correctName = null;
  if (finishedToday) {
    const daily = await getDailyPokemon(today);
    correctName = daily.name;
  }

  return NextResponse.json({
    ...publicView(user, correctName),
    maxAttempts: MAX_ATTEMPTS
  });
}

export async function POST(req) {
  await ensureSchema();
  const session = getSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });

  let user = await loadUser(session);
  if (!user) return NextResponse.json({ error: 'usuário não encontrado' }, { status: 404 });

  user = await syncDailyState(user);

  const today = todayStr();
  const finishedToday = user.last_result_date && String(user.last_result_date).slice(0, 10) === today;
  if (finishedToday) {
    const daily = await getDailyPokemon(today);
    return NextResponse.json({ ...publicView(user, daily.name), maxAttempts: MAX_ATTEMPTS });
  }

  const body = await req.json().catch(() => ({}));
  const guess = normalize(body.guess || '');
  const daily = await getDailyPokemon(today);

  if (!guess) {
    return NextResponse.json({ ...publicView(user, null), maxAttempts: MAX_ATTEMPTS });
  }

  let updated;
  if (guess === normalize(daily.name)) {
    const newStreak = user.streak + 1;
    const newBest = Math.max(user.best, newStreak);
    const result = await sql`
      UPDATE users
      SET streak = ${newStreak},
          best = ${newBest},
          last_correct_date = ${today},
          last_result_date = ${today},
          last_result = 'correct'
      WHERE id = ${user.id}
      RETURNING *
    `;
    updated = result.rows[0];
    return NextResponse.json({
      ...publicView(updated, daily.name),
      maxAttempts: MAX_ATTEMPTS,
      justSolved: true,
      wonPrize: newStreak > 0 && newStreak % 15 === 0
    });
  } else {
    const attemptsUsed = user.attempts_today + 1;
    if (attemptsUsed >= MAX_ATTEMPTS) {
      const result = await sql`
        UPDATE users
        SET streak = 0,
            attempts_today = ${attemptsUsed},
            last_result_date = ${today},
            last_result = 'failed'
        WHERE id = ${user.id}
        RETURNING *
      `;
      updated = result.rows[0];
      return NextResponse.json({
        ...publicView(updated, daily.name),
        maxAttempts: MAX_ATTEMPTS,
        wrong: true
      });
    } else {
      const result = await sql`
        UPDATE users
        SET attempts_today = ${attemptsUsed}
        WHERE id = ${user.id}
        RETURNING *
      `;
      updated = result.rows[0];
      return NextResponse.json({
        ...publicView(updated, null),
        maxAttempts: MAX_ATTEMPTS,
        wrong: true
      });
    }
  }
}
