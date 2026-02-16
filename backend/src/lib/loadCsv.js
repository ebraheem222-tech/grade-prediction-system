import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export function readCsv(filepath) {
  return parse(fs.readFileSync(filepath), { columns: true, skip_empty_lines: true });
}

export function loadCsvs(baseDir = "data") {
  const join = (p) => path.join(baseDir, p);
  const courses = readCsv(join("courses.csv"));
  const students = readCsv(join("students.csv"));
  const transcripts = readCsv(join("transcripts.csv"));
  return { courses, students, transcripts };
}