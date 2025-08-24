import express from "express";
import cors from "cors";
import { z } from "zod";
import { predictGrade } from "./lib/knn.js";
import { buildData } from "./lib/data.js";

const app = express();
app.use(cors());
app.use(express.json());

const { courseIdByCode, studentVectors, takers, courseById } =
  buildData({ baseDir: process.env.DATA_DIR || "data" });

app.get("/", (_req, res) => res.json({ ok: true, routes: ["GET /health", "POST /predict"] }));
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

const Body = z.object({
  studentGrades: z.array(z.object({
    courseCode: z.string(),
    grade: z.number().min(0).max(100)
  })).min(2),
  targetCourseCode: z.string(),
  k: z.number().int().min(1).max(50).optional(),
  minCommonCourses: z.number().int().min(1).max(50).optional()
});

app.post("/predict", (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { studentGrades, targetCourseCode, k, minCommonCourses } = parsed.data;

  // Build query vector from posted grades
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
    minCommonCourses: minCommonCourses ?? 2
  });

  const neighbors = result.neighbors.map(n => ({
    studentId: n.sid,
    similarity: Math.round(n.sim * 1000) / 1000,
    overlap: n.overlap,
    theirGrade: Math.round(n.grade01 * 1000) / 10
  }));

  res.json({
    targetCourse: { id: targetCourseId, code: courseById[targetCourseId]?.code },
    predictedGrade: result.predictedGrade,
    confidence: result.confidence,
    k: neighbors.length,
    neighbors
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KNN API on http://localhost:${PORT}`));