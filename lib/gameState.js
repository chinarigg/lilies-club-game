import { sql } from './db';
import { todayStr, daysBetween } from './pokemon';

// Applies day-boundary rules to a user row: breaks the streak if more than
// one day passed since the last correct guess, and resets the attempt
// counter when a new day starts. Persists changes if anything moved.
export async function syncDailyState(user) {
  const today = todayStr();
  let streak = user.streak;
  let attempts_today = user.attempts_today;
  let attempts_date = user.attempts_date;
  let changed = false;

  if (user.last_correct_date) {
    const gap = daysBetween(today, isoDate(user.last_correct_date));
    if (gap > 1 && streak !== 0) {
      streak = 0;
      changed = true;
    }
  }

  if (!attempts_date || isoDate(attempts_date) !== today) {
    attempts_date = today;
    attempts_today = 0;
    changed = true;
  }

  if (changed) {
    await sql`
      UPDATE users
      SET streak = ${streak}, attempts_today = ${attempts_today}, attempts_date = ${attempts_date}
      WHERE id = ${user.id}
    `;
    user = { ...user, streak, attempts_today, attempts_date };
  }

  return user;
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export function isoDateSafe(value) {
  return isoDate(value);
}

export function publicView(user, correctName) {
  const today = todayStr();
  const finishedToday = user.last_result_date && isoDate(user.last_result_date) === today;
  const view = {
    streak: user.streak,
    best: user.best,
    attemptsToday: user.attempts_today,
    finished: !!finishedToday,
    result: finishedToday ? user.last_result : null
  };
  if (finishedToday && correctName) view.correctName = correctName;
  return view;
}
