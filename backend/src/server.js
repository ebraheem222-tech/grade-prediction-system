// src/server.js
import express from "express";
import cors from "cors";
import { z } from "zod";
import { predictGrade } from "./lib/knn.js";
import { buildData } from "./lib/data.js";

const app = express();
app.use(cors());
app.use(express.json());

let data = buildData({ baseDir: process.env.DATA_DIR || "data" });
let { courseIdByCode, studentVectors, takers, courseById, courses } = data;

console.log("[server] started", new Date().toISOString(), "DATA_DIR=", process.env.DATA_DIR || "data");

// Root route
app.get("/", (_req, res) =>
  res.json({
    ok: true,
    routes: [
      "GET /health",
      "POST /predict",
      "GET /debug/code/:code",
      "GET /debug/dupes",
      "POST /debug/reload"
    ],
  })
);


app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// --- DEBUG ROUTES ---
app.get("/debug/code/:code", (req, res) => {
  const code = String(req.params.code || "").trim();
  const candidates = courses
    .filter(c => String(c.code || "").trim() === code)
    .map(c => {
      const id = String(c.courseId || "").trim();
      return { courseId: id, name: c.name ?? null, takers: takers[id]?.size ?? 0 };
    });
  res.json({ code, preferredCourseId: courseIdByCode[code] ?? null, candidates });
});

app.get("/debug/dupes", (_req, res) => {
  const byCode = new Map();
  for (const c of courses) {
    const code = String(c.code || "").trim();
    const id   = String(c.courseId || "").trim();
    if (!code || !id) continue;
    if (!byCode.has(code)) byCode.set(code, new Set());
    byCode.get(code).add(id);
  }
  const duplicates = [];
  for (const [code, set] of byCode) {
    if (set.size > 1) {
      const ids = [...set];
      duplicates.push({ code, courseIds: ids, takers: ids.map(id => takers[id]?.size ?? 0) });
    }
  }
  res.json({ duplicates });
});

app.post("/debug/reload", (_req, res) => {
  data = buildData({ baseDir: process.env.DATA_DIR || "data" });
  ({ courseIdByCode, studentVectors, takers, courseById, courses } = data);
  res.json({ ok: true, reloaded: true });
});

// --- PREDICT ROUTE ---
const Body = z.object({
  studentGrades: z.array(z.object({ courseCode: z.string(), grade: z.number().min(0).max(100) })).min(2),
  targetCourseCode: z.string(),
  k: z.number().int().min(1).max(50).optional(),
  minCommonCourses: z.number().int().min(1).max(50).optional(),
});

app.post("/predict", (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { studentGrades, targetCourseCode, k, minCommonCourses } = parsed.data;

  const qVec = {};
  for (const g of studentGrades) {
    const cid = courseIdByCode[g.courseCode];
    if (cid) qVec[cid] = Math.max(0, Math.min(100, g.grade)) / 100;
  }

  const targetCourseId = courseIdByCode[targetCourseCode];
  if (!targetCourseId) return res.status(404).json({ error: "Unknown targetCourseCode" });

  const result = predictGrade({
    queryVector: qVec,
    targetCourseId,
    studentVectors,
    takersForCourse: takers[targetCourseId],
    k: k ?? 7,
    minCommonCourses: minCommonCourses ?? 2,
  });

  const neighbors = result.neighbors.map(n => ({
    studentId: n.sid,
    similarity: Math.round(n.sim * 1000) / 1000,
    overlap: n.overlap,
    theirGrade: Math.round(n.grade01 * 1000) / 10,
  }));

  res.json({
    targetCourse: { id: targetCourseId, code: courseById[targetCourseId]?.code },
    predictedGrade: result.predictedGrade,
    confidence: result.confidence,
    k: neighbors.length,
    neighbors,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KNN API on http://localhost:${PORT}`));
