// The content linter: every lesson must follow the 10-step template and the Persian-fading rule.
import { describe, expect, it, it as test } from "vitest";

import { syllabusId } from "../../src/lib/coverage";
import { loadLessons, loadSyllabus, loadYaml } from "./load-content";

const MINDMAP_HEADING = /^# /mu;
const PERSIAN_BLOCK = /<Persian(?<attrs>\s[^>]*)?>/gu;

const lessons = loadLessons();
const syllabus = new Map(loadSyllabus().map((s) => [s.id, s]));
const EXPECTED_PERSIAN: Record<string, "full" | "tip" | "none"> = {
  A1: "full",
  A2: "full",
  B1: "tip",
  B2: "tip",
  C1: "none",
  C2: "none",
};

describe.each(lessons.map((l) => [l.id, l] as const))(
  "lesson %s",
  (_id, lesson) => {
    const d = lesson.data;

    test("sits in the right folder and matches its planned syllabus entry", () => {
      const [folder, file] = lesson.id.split("/");
      expect(folder).toBe(String(d.level).toLowerCase());
      expect(file.startsWith(`${String(d.number).padStart(2, "0")}-`)).toBe(
        true
      );
      const planned = syllabus.get(syllabusId(d.level, d.number));
      expect(planned, "lesson must be in the syllabus").toBeDefined();
      expect(d.pillar).toBe(planned?.pillar);
      expect(d.size).toBe(planned?.size);
    });

    test("has the template parts: hook, rule, ≤7 points, mindmap, ≥8 exercises, ≥3 recall, ≥3 cards", () => {
      expect(d.hook?.length).toBeGreaterThan(10);
      expect(d.rule?.length).toBeGreaterThan(10);
      expect(d.points.length).toBeGreaterThanOrEqual(2);
      expect(d.points.length).toBeLessThanOrEqual(7);
      expect(String(d.mindmap)).toMatch(MINDMAP_HEADING);
      expect(d.exercises.length).toBeGreaterThanOrEqual(8);
      expect(d.recall.length).toBeGreaterThanOrEqual(3);
      expect(d.cards.length).toBeGreaterThanOrEqual(3);
    });

    test("follows the Persian-fading rule for its level", () => {
      const expected = EXPECTED_PERSIAN[d.level];
      expect(d.persian).toBe(expected);
      const blocks = [...lesson.body.matchAll(PERSIAN_BLOCK)].map((m) =>
        m.groups?.attrs?.includes('kind="tip"') ? "tip" : "full"
      );
      const followsRule =
        expected === "none"
          ? blocks.length === 0
          : blocks.length > 0 && blocks.every((b) => b === expected);
      expect(
        followsRule,
        `Persian blocks for ${d.level}: ${blocks.join(", ") || "none"}`
      ).toBe(true);
    });

    test("has well-formed exercises", () => {
      for (const ex of d.exercises) {
        expect(ex.explain, `${ex.type} needs an explanation`).toBeTruthy();
      }
      for (const ex of d.exercises.filter((e) => e.type === "mcq")) {
        expect(ex.answer).toBeLessThan(ex.options?.length ?? 0);
      }
      for (const ex of d.exercises.filter((e) => e.type === "gap")) {
        expect(ex.prompt).toContain("___");
      }
      for (const ex of d.exercises.filter((e) => e.type === "correct")) {
        expect(ex.answers).not.toContain(ex.prompt);
      }
    });

    test("uses a mix of exercise types", () => {
      expect(
        new Set(d.exercises.map((e) => e.type)).size
      ).toBeGreaterThanOrEqual(3);
    });
  }
);

describe("Grammar Tips index", () => {
  const traps = loadYaml<{ id: string; lesson: string }[]>(
    "reference/persian-traps.yaml"
  );
  it("maps every trap to a planned lesson", () => {
    for (const t of traps) {
      expect(syllabus.has(t.lesson), `${t.id} → ${t.lesson}`).toBe(true);
    }
  });
  it("has unique ids", () => {
    expect(new Set(traps.map((t) => t.id)).size).toBe(traps.length);
  });
});
