import { getSessionFromCookies } from '../../../../lib/auth';
import { getDailyPokemon, getSpriteUrl, todayStr } from '../../../../lib/pokemon';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) return new Response('não autenticado', { status: 401 });

  const today = todayStr();
  const daily = await getDailyPokemon(today);
  const url = await getSpriteUrl(daily.id);

  const imgRes = await fetch(url);
  const buf = await imgRes.arrayBuffer();

  return new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=3600'
    }
  });
}
