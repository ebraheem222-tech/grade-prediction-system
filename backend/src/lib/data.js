// lib/data.js
import { loadCsvs } from "./loadCsv.js";

const TERM_ORDER = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };

function clamp01(x) {
  const g = Math.max(0, Math.min(100, Number(x)));
  return g / 100;
}

function isNewer(a, b) {
  // Prefer higher attemptNo, then later year, then later term
  const aTry = Number(a.attemptNo ?? 1), bTry = Number(b.attemptNo ?? 1);
  if (aTry !== bTry) return aTry > bTry;
  const aYear = Number(a.year ?? 0), bYear = Number(b.year ?? 0);
  if (aYear !== bYear) return aYear > bYear;
  const aTerm = TERM_ORDER[String(a.term)] ?? 0;
  const bTerm = TERM_ORDER[String(b.term)] ?? 0;
  return aTerm >= bTerm;
}

/**
 * Build in-memory data structures from CSVs.
 * - Picks the courseId for each code that has the MOST takers in transcripts.
 * - Keeps only the best (latest) attempt per (studentId, courseId).
 * - Returns takers as Sets (use .size when serializing).
 */
export function buildData({ baseDir = "data", log = true } = {}) {
  const { courses, students, transcripts } = loadCsvs(baseDir);

  // --- Normalize & index courses ---
  const courseById = Object.fromEntries(
    courses.map(c => [String(c.courseId || "").trim(), c])
  );

  // Group every code -> all courseIds that use that code
  const rawIdsByCode = new Map();
  for (const c of courses) {
    const code = String(c.code || "").trim();
    const id   = String(c.courseId || "").trim();
    if (!code || !id) continue;
    if (!rawIdsByCode.has(code)) rawIdsByCode.set(code, new Set());
    rawIdsByCode.get(code).add(id);
  }

  // --- Keep only the latest attempt per (student, course) ---
  const bestAttempt = new Map(); // key = `${sid}|${cid}` => transcript row
  for (const r of transcripts) {
    const sid = String(r.studentId || "").trim();
    const cid = String(r.courseId  || "").trim();
    if (!sid || !cid) continue;
    const key = `${sid}|${cid}`;
    if (!bestAttempt.has(key) || isNewer(r, bestAttempt.get(key))) {
      bestAttempt.set(key, r);
    }
  }

  // --- Build student vectors & takers ---
  const studentVectors = {};           // { [studentId]: { [courseId]: grade01 } }
  const takers = {};                   // { [courseId]: Set<studentId> }
  for (const [, r] of bestAttempt) {
    const sid = String(r.studentId).trim();
    const cid = String(r.courseId).trim();
    const g01 = clamp01(r.grade);
    (studentVectors[sid] ||= {})[cid] = g01;
    (takers[cid] ||= new Set()).add(sid);
  }

  // --- Choose preferred courseId per code by MAX takers ---
  const courseIdByCode = {};           // { [code]: preferredCourseId }
  const courseIdsByCode = {};          // { [code]: string[] } for debugging
  for (const [code, idSet] of rawIdsByCode.entries()) {
    let bestId = null;
    let bestCount = -1;
    for (const id of idSet) {
      const count = takers[id]?.size ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestId = id;
      }
    }
    courseIdByCode[code] = bestId ?? [...idSet][0] ?? null;
    courseIdsByCode[code] = [...idSet];
  }

  if (log) {
    console.log(
      `[data] courses=${courses.length} students=${students.length} transcripts(raw)=${transcripts.length}`
    );
    console.log(
      `[data] studentVectors=${Object.keys(studentVectors).length} takers(courses)=${Object.keys(takers).length}`
    );
    // Warn about duplicate codes and show taker counts per candidate id
    for (const [code, ids] of Object.entries(courseIdsByCode)) {
      if (ids.length > 1) {
        const counts = ids.map(id => `${id}:${takers[id]?.size ?? 0}`).join(", ");
        console.log(`[warn] duplicate code "${code}" -> [${counts}] (picked: ${courseIdByCode[code]})`);
      }
    }
  }

  return {
    courses,
    students,
    transcripts,
    courseById,
    courseIdByCode,
    courseIdsByCode,   // useful for /debug endpoints
    studentVectors,
    takers
  };
}
