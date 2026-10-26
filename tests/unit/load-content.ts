// Reads course content straight from disk (no Astro needed) for the linter and coverage tests.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { parse } from "yaml"

import type { InventoryPoint, SyllabusItem } from "../../src/lib/coverage"

const ROOT = join(import.meta.dirname, "../../src/content")

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

export interface LessonFile {
  /** e.g. "a1/05-be-am-is-are" */
  id: string
  path: string
  data: Record<string, any>
  body: string
}

export function loadLessons(): LessonFile[] {
  const dir = join(ROOT, "lessons")
  return walk(dir)
    .filter((p) => p.endsWith(".mdx"))
    .map((path) => {
      const text = readFileSync(path, "utf8")
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
      if (!match) throw new Error(`${path}: missing frontmatter`)
      return {
        id: relative(dir, path).replace(/\\/g, "/").replace(/\.mdx$/, ""),
        path,
        data: parse(match[1]),
        body: match[2],
      }
    })
}

export function loadSyllabus(): SyllabusItem[] {
  return parse(readFileSync(join(ROOT, "syllabus/syllabus.yaml"), "utf8"))
}

export function loadInventory(): InventoryPoint[] {
  const dir = join(ROOT, "inventory")
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .flatMap((f) => {
      const file = parse(readFileSync(join(dir, f), "utf8"))
      return (file.points as any[]).map((p) => ({ aliases: [], sources: [], ...p, pillar: file.pillar }))
    })
}

export function loadYaml<T = any>(relPath: string): T {
  return parse(readFileSync(join(ROOT, relPath), "utf8"))
}
