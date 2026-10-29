// biome-ignore lint/correctness/noUnresolvedImports: astro:content is a virtual module provided by Astro at build time
import { type CollectionEntry, getCollection } from "astro:content";

import {
  computeCoverage,
  type InventoryPoint,
  type SyllabusItem,
  syllabusId,
} from "@/lib/coverage";
import { LEVELS, type Level } from "@/lib/taxonomy";

export type Lesson = CollectionEntry<"lessons">;

const levelIndex = (level: string) => LEVELS.indexOf(level as Level);

export const lessonHref = (lesson: Lesson) => `/lessons/${lesson.id}`;

/** Published lessons in learning order: A1.1 … C2.30. */
export async function getLessons(): Promise<Lesson[]> {
  const lessons = await getCollection("lessons");
  return lessons.sort(
    (a, b) =>
      levelIndex(a.data.level) - levelIndex(b.data.level) ||
      a.data.number - b.data.number
  );
}

export async function getLessonsByLevel(): Promise<Record<Level, Lesson[]>> {
  const lessons = await getLessons();
  const out = Object.fromEntries(
    LEVELS.map((l) => [l, [] as Lesson[]])
  ) as Record<Level, Lesson[]>;
  for (const lesson of lessons) {
    out[lesson.data.level].push(lesson);
  }
  return out;
}

export interface PlannedLesson extends SyllabusItem {
  /** The published lesson, if it has been written. */
  lesson?: Lesson;
}

/** The full planned course (250 lessons), each linked to its published lesson when available. */
export async function getSyllabus(): Promise<PlannedLesson[]> {
  const [items, lessons] = await Promise.all([
    getCollection("syllabus"),
    getLessons(),
  ]);
  const published = new Map(
    lessons.map((l) => [syllabusId(l.data.level, l.data.number), l])
  );
  return items
    .map((e) => ({ id: e.id, ...e.data, lesson: published.get(e.id) }))
    .sort(
      (a, b) => levelIndex(a.level) - levelIndex(b.level) || a.number - b.number
    );
}

export async function getInventory(): Promise<InventoryPoint[]> {
  const files = await getCollection("inventory");
  return files.flatMap((file) =>
    file.data.points.map((p) => ({ ...p, pillar: file.data.pillar }))
  );
}

export async function getCoverage() {
  const [points, syllabus, lessons] = await Promise.all([
    getInventory(),
    getSyllabus(),
    getLessons(),
  ]);
  return computeCoverage(
    points,
    syllabus,
    lessons.map((l) => ({
      covers: l.data.covers,
      id: l.id,
      level: l.data.level,
      number: l.data.number,
    }))
  );
}

/** Minutes for planning: core ≈ 45, mini ≈ 20. */
export const sizeMinutes = (size: "core" | "mini") =>
  size === "core" ? 45 : 20;
export const lessonMinutes = (lesson: Lesson) => sizeMinutes(lesson.data.size);
