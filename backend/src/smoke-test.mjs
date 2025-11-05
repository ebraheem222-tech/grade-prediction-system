// smoke-test.mjs
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000';

async function post(path, body, label='') {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  console.log(`\n=== ${label || path} ===`);
  console.log('status:', res.status);
  console.log('body  :', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  return { ok: res.ok, status: res.status, data };
}

function extractPrediction(payload) {
  if (!payload || typeof payload !== 'object') return null;
  // common shapes
  const cand =
    payload.prediction ??
    payload.result ??
    payload; // sometimes the fields are top-level
  if (!cand || typeof cand !== 'object') return null;
  const pg = cand.predictedGrade ?? cand.predicted_grade ?? cand.grade;
  const neigh = cand.neighbors ?? cand.similar ?? [];
  return { pg, neighbors: neigh, raw: cand };
}

(async () => {
  // --- Validation check (should 400) ---
  await post('/predict', {
    studentGrades: [{ courseCode: 'ENG102', grade: 85, courseId: 'C_ENG102' }], // only 1
    targetCourseCode: 'CS102',
    targetCourseId: 'C_CS102',
    k: 3,
    minCommonCourses: 1
  }, 'predict: one-grade (expect 400)');

  // --- Variant A: codes + ids ---
  const A = await post('/predict', {
    studentGrades: [
      { courseCode: 'ENG102',  grade: 85, courseId: 'C_ENG102' },
      { courseCode: 'MATH201', grade: 70, courseId: 'C_MATH201' }
    ],
    targetCourseCode: 'CS102',
    targetCourseId: 'C_CS102',
    k: 3,
    minCommonCourses: 1
  }, 'predict: codes + ids');

  // --- Variant B: codes only ---
  const B = await post('/predict', {
    studentGrades: [
      { courseCode: 'ENG102',  grade: 85 },
      { courseCode: 'MATH201', grade: 70 }
    ],
    targetCourseCode: 'CS102',
    k: 3,
    minCommonCourses: 1
  }, 'predict: codes only');

  // --- Variant C: ids only ---
  const C = await post('/predict', {
    studentGrades: [
      { courseId: 'C_ENG102',  grade: 85 },
      { courseId: 'C_MATH201', grade: 70 }
    ],
    targetCourseId: 'C_CS102',
    k: 3,
    minCommonCourses: 1
  }, 'predict: ids only');

  // Try to parse any successful response
  for (const [label, resp] of [['A',A],['B',B],['C',C]]) {
    if (!resp.ok) continue;
    const parsed = extractPrediction(resp.data);
    console.log(`\n--- parsed ${label} ---`);
    console.log(parsed);
    if (parsed && typeof parsed.pg === 'number') {
      console.log(`✅ ${label} predictedGrade:`, parsed.pg);
      return;
    }
  }

  // If we get here, none returned a numeric predictedGrade
  console.error('\n❗ No numeric predictedGrade found. Likely causes:\n' +
    '- neighbors = 0 (dataset has no overlap for CS102 with ENG102/MATH201), or\n' +
    "- the server's response shape uses a different field name.\n" +
    'Check the printed bodies above for keys like { prediction: { ... } } or a message about 0 neighbors.');
})();
