import { loadCsvs } from "./loadCsv.js";

const TERM_ORDER = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };

function clamp01(x) {
  const g = Math.max(0, Math.min(100, Number(x)));
  return g / 100;
}

function isNewer(a, b) {
  const aTry = Number(a.attemptNo ?? 1), bTry = Number(b.attemptNo ?? 1);
  if (aTry !== bTry) return aTry > bTry;
  const aYear = Number(a.year ?? 0), bYear = Number(b.year ?? 0);
  if (aYear !== bYear) return aYear > bYear;
  const aTerm = TERM_ORDER[a.term] ?? 0, bTerm = TERM_ORDER[b.term] ?? 0;
  return aTerm >= bTerm;
}

export function buildData({ baseDir = "data", log = true } = {}) {
  const { courses, students, transcripts } = loadCsvs(baseDir);
  const courseById = Object.fromEntries(courses.map(c => [c.courseId, c]));
  const courseIdByCode = Object.fromEntries(
    courses.filter(c => c.code).map(c => [c.code, c.courseId])
  );
  
  const best = new Map();
  for (const r of transcripts) {
    const studentId = r.studentId;
    const courseId = r.courseId;
    if (!studentId || !courseId) continue;
    const key = `${studentId}|${courseId}`;
    if (!best.has(key) || isNewer(r, best.get(key))) best.set(key, r);
  }
  
  const studentVectors = {};
  const takers = {};
  for (const [key, r] of best) {
    const { studentId, courseId, grade } = r;
    const g01 = clamp01(grade);
    (studentVectors[studentId] ||= {})[courseId] = g01;
    if (!takers[courseId]) takers[courseId] = new Set();
    takers[courseId].add(studentId);
  }
  
  if (log) {
    console.log(`[data] courses=${courses.length} students=${students.length} transcripts(raw)=${transcripts.length}`);
    console.log(`[data] studentVectors=${Object.keys(studentVectors).length} takers(courses)=${Object.keys(takers).length}`);
  }
  
  return { courses, students, transcripts, courseById, courseIdByCode, studentVectors, takers };
}