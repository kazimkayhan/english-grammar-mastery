// "Nothing left out": the build-blocking coverage checks.
import { describe, expect, it } from "vitest"

import { computeCoverage } from "../../src/lib/coverage"
import { loadInventory, loadLessons, loadSyllabus } from "./load-content"

const points = loadInventory()
const syllabus = loadSyllabus()
const lessons = loadLessons().map((l) => ({
  id: l.id,
  level: l.data.level,
  number: l.data.number,
  covers: l.data.covers ?? [],
}))
const result = computeCoverage(points, syllabus, lessons)

describe("syllabus", () => {
  it("has 250 lessons with unique ids", () => {
    expect(syllabus.length).toBe(250)
    expect(new Set(syllabus.map((s) => s.id)).size).toBe(250)
  })
  it("numbers each level 1…n without gaps", () => {
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      const nums = syllabus.filter((s) => s.level === level).map((s) => s.number)
      expect(nums).toEqual(nums.map((_, i) => i + 1))
    }
  })
})

describe("grammar inventory coverage", () => {
  it("has no duplicate point ids", () => {
    expect(result.duplicates).toEqual([])
  })
  it("assigns every point to a planned lesson", () => {
    expect(result.unplanned.map((p) => `${p.id} → ${p.lesson}`)).toEqual([])
  })
  it("gives every planned lesson at least one grammar point", () => {
    expect(result.emptyLessons.map((s) => `${s.id} ${s.title}`)).toEqual([])
  })
  it("has published lessons that teach every point assigned to them", () => {
    expect(result.missing.map((m) => `${m.lesson} is missing ${m.point.id}`)).toEqual([])
  })
  it("only lists existing inventory ids in `covers`", () => {
    expect(result.unknown.map((u) => `${u.lesson}: ${u.id}`)).toEqual([])
  })
  it("has no published lesson outside the syllabus", () => {
    expect(result.strayLessons).toEqual([])
  })
  it("keeps each point's level the same as its lesson's level", () => {
    const levelOf = new Map(syllabus.map((s) => [s.id, s.level]))
    expect(points.filter((p) => levelOf.get(p.lesson) !== p.level).map((p) => `${p.id}: ${p.level} vs ${p.lesson}`)).toEqual([])
  })
})
