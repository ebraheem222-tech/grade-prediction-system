export function normalize01(grade) {
  const g = Math.max(0, Math.min(100, Number(grade)));
  return g / 100;
}

export function cosineSim(vecA, vecB) {
  let dot = 0, na = 0, nb = 0, overlap = 0;
  for (const k in vecA) if (k in vecB) {
    const a = vecA[k], b = vecB[k];
    dot += a * b;
    na += a * a;
    nb += b * b;
    overlap++;
  }
  const sim = overlap && na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  return { sim, overlap };
}