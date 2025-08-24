import { cosineSim } from "./math.js";

export function predictGrade({
  queryVector,
  targetCourseId,
  studentVectors,
  takersForCourse,
  k = 5,
  minCommonCourses = 2
}) {
  const eps = 1e-6;
  const neighbors = [];
  
  for (const sid of takersForCourse || []) {
    const vec = studentVectors[sid];
    if (!vec) continue;
    const { sim, overlap } = cosineSim(queryVector, vec);
    if (overlap >= minCommonCourses && sim > 0) {
      const their = vec[targetCourseId];
      if (their != null) neighbors.push({ sid, sim, overlap, grade01: their });
    }
  }
  
  neighbors.sort((a, b) => b.sim - a.sim);
  const top = neighbors.slice(0, k);
  
  let num = 0, den = 0;
  for (const n of top) {
    num += n.grade01 * (n.sim + eps);
    den += (n.sim + eps);
  }
  
  const predicted = top.length ? Math.round((num / den) * 1000) / 10 : null;
  const meanSim = top.length ? top.reduce((s, n) => s + n.sim, 0) / top.length : 0;
  const confidence = Math.round(100 * Math.min(1, (top.length / k) * 0.6 + meanSim * 0.4));
  
  return { predictedGrade: predicted, neighbors: top, confidence };
}