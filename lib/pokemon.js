const POKE_RANGE = 1025;
const EPOCH_OFFSET = 738; // arbitrary shift so day 0 isn't Bulbasaur forever
export const MAX_ATTEMPTS = 2;
export const REVEAL_INSETS = [38, 15, 0]; // % inset at 0, 1, 2 wrong guesses used

export function todayStr() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(aStr, bStr) {
  const a = new Date(aStr + 'T00:00:00Z');
  const b = new Date(bStr + 'T00:00:00Z');
  return Math.round((a - b) / 86400000);
}

export function dailyPokemonId(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNumber = Math.floor(d.getTime() / 86400000) + EPOCH_OFFSET;
  return (dayNumber % POKE_RANGE) + 1;
}

export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// simple in-memory cache: one entry per day is all we ever need
const cache = new Map();

export async function getDailyPokemon(dateStr) {
  if (cache.has(dateStr)) return cache.get(dateStr);

  const id = dailyPokemonId(dateStr);

  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const species = await speciesRes.json();
  const entry =
    species.names.find((n) => n.language.name === 'pt-BR') ||
    species.names.find((n) => n.language.name === 'pt') ||
    species.names.find((n) => n.language.name === 'en');
  const name = entry ? entry.name : species.name;

  const data = { id, name };
  cache.set(dateStr, data);
  return data;
}

export async function getSpriteUrl(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  return (
    (data.sprites.other &&
      data.sprites.other['official-artwork'] &&
      data.sprites.other['official-artwork'].front_default) ||
    data.sprites.front_default
  );
}
