import { Pool } from 'pg';

let pool;
function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString && connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

// Minimal tagged-template helper so query code can read like `sql`...``
// e.g. sql`SELECT * FROM users WHERE id = ${id}`
export function sql(strings, ...values) {
  let text = '';
  strings.forEach((chunk, i) => {
    text += chunk;
    if (i < values.length) text += `$${i + 1}`;
  });
  return getPool()
    .query(text, values)
    .then((result) => ({ rows: result.rows }));
}

let ready = false;

export async function ensureSchema() {
  if (ready) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      streak INT NOT NULL DEFAULT 0,
      best INT NOT NULL DEFAULT 0,
      last_correct_date DATE,
      last_result_date DATE,
      last_result TEXT,
      attempts_today INT NOT NULL DEFAULT 0,
      attempts_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  ready = true;
}
