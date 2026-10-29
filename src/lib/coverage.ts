// Coverage: no grammar point may be left out.
//  1. Every inventory point is assigned to a planned syllabus lesson.
//  2. Once that lesson is published, it must list the point in `covers`.
//  3. Every `covers` id must exist in the inventory (no typos).
// Pure functions so tests, the report script and pages share one implementation.

export interface InventoryPoint {
  aliases: string[];
  id: string;
  lesson: string;
  level: string;
  pillar: string;
  sources: string[];
  title: string;
}

export interface SyllabusItem {
  id: string;
  level: string;
  number: number;
  pillar: string;
  size: "core" | "mini";
  title: string;
}

export interface PublishedLesson {
  covers: string[];
  /** Content id, e.g. "a1/05-be-am-is-are". */
  id: string;
  level: string;
  number: number;
}

export const syllabusId = (level: string, number: number) =>
  `${level.toLowerCase()}-${String(number).padStart(2, "0")}`;

export interface CoverageResult {
  duplicates: string[];
  /** Planned lessons with no inventory point assigned. */
  emptyLessons: SyllabusItem[];
  /** Points whose planned lesson is published but doesn't list them in `covers`. */
  missing: { point: InventoryPoint; lesson: string }[];
  /** Published lessons that aren't in the syllabus (wrong level/number). */
  strayLessons: string[];
  /** point id → content ids of published lessons that teach it */
  taughtBy: Map<string, string[]>;
  /** Points taught by at least one published lesson. */
  taughtCount: number;
  /** `covers` ids that don't exist in the inventory. */
  unknown: { lesson: string; id: string }[];
  /** Points whose `lesson` isn't in the syllabus. */
  unplanned: InventoryPoint[];
}

export function computeCoverage(
  points: InventoryPoint[],
  syllabus: SyllabusItem[],
  lessons: PublishedLesson[]
): CoverageResult {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const p of points) {
    if (seen.has(p.id)) {
      duplicates.push(p.id);
    }
    seen.add(p.id);
  }

  const plannedIds = new Set(syllabus.map((s) => s.id));
  const unplanned = points.filter((p) => !plannedIds.has(p.lesson));

  const bySyllabus = new Map(
    lessons.map((l) => [syllabusId(l.level, l.number), l])
  );
  const strayLessons = lessons
    .filter((l) => !plannedIds.has(syllabusId(l.level, l.number)))
    .map((l) => l.id);

  const taughtBy = new Map<string, string[]>(points.map((p) => [p.id, []]));
  const unknown: CoverageResult["unknown"] = [];
  for (const lesson of lessons) {
    for (const id of lesson.covers) {
      const list = taughtBy.get(id);
      if (list) {
        list.push(lesson.id);
      } else {
        unknown.push({ id, lesson: lesson.id });
      }
    }
  }

  const missing: CoverageResult["missing"] = [];
  for (const point of points) {
    const lesson = bySyllabus.get(point.lesson);
    if (lesson && !lesson.covers.includes(point.id)) {
      missing.push({ lesson: lesson.id, point });
    }
  }

  const assigned = new Set(points.map((p) => p.lesson));
  const emptyLessons = syllabus.filter((s) => !assigned.has(s.id));
  const taughtCount = [...taughtBy.values()].filter((l) => l.length > 0).length;

  return {
    duplicates,
    emptyLessons,
    missing,
    strayLessons,
    taughtBy,
    taughtCount,
    unknown,
    unplanned,
  };
}

export const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
