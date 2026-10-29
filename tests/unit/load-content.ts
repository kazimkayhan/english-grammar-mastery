// Reads course content straight from disk (no Astro needed) for the linter and coverage tests.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";

import type { InventoryPoint, SyllabusItem } from "../../src/lib/coverage";

const ROOT = join(import.meta.dirname, "../../src/content");
const FRONTMATTER =
  /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---\r?\n(?<body>[\s\S]*)$/u;
const MDX_SUFFIX = /\.mdx$/u;
const BACKSLASH = /\\/gu;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export interface ExerciseFrontmatter {
  answer?: number;
  answers?: string[];
  explain?: string;
  options?: string[];
  prompt?: string;
  type: string;
}

export interface LessonFrontmatter {
  cards: unknown[];
  covers?: string[];
  exercises: ExerciseFrontmatter[];
  hook?: string;
  level: string;
  mindmap: string;
  number: number;
  persian: "full" | "tip" | "none";
  pillar: string;
  points: string[];
  recall: unknown[];
  rule?: string;
  size: string;
}

export interface LessonFile {
  body: string;
  data: LessonFrontmatter;
  /** e.g. "a1/05-be-am-is-are" */
  id: string;
  path: string;
}

export function loadLessons(): LessonFile[] {
  const dir = join(ROOT, "lessons");
  return walk(dir)
    .filter((p) => p.endsWith(".mdx"))
    .map((path) => {
      const text = readFileSync(path, "utf8");
      const match = FRONTMATTER.exec(text);
      if (!match?.groups) {
        throw new Error(`${path}: missing frontmatter`);
      }
      return {
        body: match.groups.body,
        data: parse(match.groups.frontmatter),
        id: relative(dir, path).replace(BACKSLASH, "/").replace(MDX_SUFFIX, ""),
        path,
      };
    });
}

export function loadSyllabus(): SyllabusItem[] {
  return parse(readFileSync(join(ROOT, "syllabus/syllabus.yaml"), "utf8"));
}

interface InventoryFileEntry
  extends Pick<InventoryPoint, "id" | "lesson" | "level" | "title"> {
  aliases?: string[];
  sources?: string[];
}

interface InventoryFile {
  pillar: string;
  points: InventoryFileEntry[];
}

export function loadInventory(): InventoryPoint[] {
  const dir = join(ROOT, "inventory");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .flatMap((f) => {
      const file = parse(readFileSync(join(dir, f), "utf8")) as InventoryFile;
      return file.points.map((p) => ({
        aliases: [],
        sources: [],
        ...p,
        pillar: file.pillar,
      }));
    });
}

export function loadYaml<T = unknown>(relPath: string): T {
  return parse(readFileSync(join(ROOT, relPath), "utf8"));
}
