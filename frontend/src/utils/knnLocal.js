// Build student vectors (0..1 grades) & takers map from transcripts array
export function buildLocalStudentVectors(transcripts) {
  const vectors = {};
  const takers = {};

  transcripts.forEach(t => {
    const studentId = t.studentId;
    const courseId = t.courseId || t.courseCode;
    const grade = parseFloat(t.grade);
    if (!studentId || !courseId || Number.isNaN(grade)) return;

    (vectors[studentId] ||= {})[courseId] = Math.max(0, Math.min(100, grade)) / 100;
    (takers[courseId] ||= new Set()).add(studentId);
  });

  return { vectors, takers };
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0, na = 0, nb = 0, overlap = 0;
  for (const k in vecA) {
    const a = vecA[k];
    na += a * a;
    if (k in vecB) {
      const b = vecB[k];
      dot += a * b;
      overlap++;
    }
  }
  for (const k in vecB) {
    const b = vecB[k];
    nb += b * b;
  }
  const sim = (na && nb) ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  return { similarity: sim, overlap };
}

export function predictLocally(studentGrades, targetCourseId, transcripts, k, minCommon) {
  const { vectors, takers } = buildLocalStudentVectors(transcripts);

  // query vector
  const q = {};
  studentGrades.forEach(g => {
    const cid = g.courseId || g.courseCode;
    if (cid) q[cid] = Math.max(0, Math.min(100, Number(g.grade))) / 100;
  });

  const pool = takers[targetCourseId];
  if (!pool || pool.size === 0) return null;

  const neighbors = [];
  for (const sid of pool) {
    const v = vectors[sid];
    if (!v || v[targetCourseId] == null) continue;
    const { similarity, overlap } = cosineSimilarity(q, v);
    if (overlap >= minCommon && similarity > 0) {
      neighbors.push({
        studentId: sid,
        similarity,
        overlap,
        theirGrade: Math.round(v[targetCourseId] * 1000 * 100) / 1000, // 0..1 -> percent
      });
    }
  }

  neighbors.sort((a, b) => b.similarity - a.similarity);
  const top = neighbors.slice(0, k);
  if (top.length === 0) return null;

  let num = 0, den = 0;
  for (const n of top) {
    num += n.theirGrade * n.similarity;
    den += n.similarity;
  }
  const predicted = den ? Math.round((num / den) * 10) / 10 : null;
  const meanSim = top.reduce((s, n) => s + n.similarity, 0) / top.length;
  const confidence = Math.round(Math.min(100, (top.length / k) * 60 + meanSim * 40));

  return {
    predictedGrade: predicted,
    neighbors: top.map(n => ({
      studentId: n.studentId,
      similarity: Math.round(n.similarity * 1000) / 1000,
      overlap: n.overlap,
      theirGrade: Math.round(n.theirGrade * 10) / 10,
    })),
  confidence,
  k: top.length
  };
}
