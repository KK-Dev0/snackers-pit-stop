export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function varietyScore(id: string): number {
  return (hashString(id) % 1000) / 1000;
}

export function normalizeFtsScores(
  raw: Map<string, number>,
): Map<string, number> {
  const out = new Map<string, number>();
  if (raw.size === 0) return out;
  const max = Math.max(...raw.values(), 1);
  for (const [id, v] of raw) {
    out.set(id, max > 0 ? v / max : 0);
  }
  return out;
}

export function compositeScore(fts: number, pantry: number, variety: number): number {
  return 0.45 * fts + 0.40 * pantry + 0.15 * variety;
}