import { defineCollection } from "astro:content"
import { file, glob } from "astro/loaders"
import { z } from "astro/zod"

import { LEVELS, PILLARS } from "@/lib/taxonomy"

const level = z.enum(LEVELS)
const pillar = z.enum(PILLARS)

// ---------------------------------------------------------------- exercises

const explain = z.string().min(1)

const mcq = z.object({
  type: z.literal("mcq"),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
  explain,
})

const gap = z.object({
  type: z.literal("gap"),
  /** Use ___ for the blank. */
  prompt: z.string().includes("___"),
  /** Optional word in brackets, e.g. (go) or a base word for word formation. */
  base: z.string().optional(),
  answers: z.array(z.string()).min(1),
  /** Capitals and final punctuation count. */
  strict: z.boolean().optional(),
  explain,
})

const correct = z.object({
  type: z.literal("correct"),
  /** A sentence with one mistake (or missing punctuation). */
  prompt: z.string(),
  answers: z.array(z.string()).min(1),
  /** Capitals and final punctuation count (punctuation lessons). */
  strict: z.boolean().optional(),
  explain,
})

const reorder = z.object({
  type: z.literal("reorder"),
  /** The correct sentence, split into chunks; they are shuffled on screen. */
  chunks: z.array(z.string()).min(3),
  /** Other accepted orders, written as full sentences. */
  alternatives: z.array(z.string()).optional(),
  explain,
})

const transform = z.object({
  type: z.literal("transform"),
  prompt: z.string(),
  keyword: z.string().optional(),
  start: z.string().optional(),
  answers: z.array(z.string()).min(1),
  explain,
})

const match = z.object({
  type: z.literal("match"),
  prompt: z.string(),
  pairs: z.array(z.tuple([z.string(), z.string()])).min(2),
  explain,
})

export const exerciseSchema = z.discriminatedUnion("type", [mcq, gap, correct, reorder, transform, match])

// ----------------------------------------------------------------- lessons

const trap = z.object({
  wrong: z.string(),
  right: z.string(),
  why: z.string(),
  /** Persian note (shown per the Persian setting). */
  fa: z.string().optional(),
})

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    level,
    number: z.number().int().positive(),
    pillar,
    size: z.enum(["core", "mini"]),
    /** One-line real-life situation that opens the lesson. */
    hook: z.string(),
    /** The rule in one sentence. */
    rule: z.string(),
    /** At most seven key points: the one-screen summary card. */
    points: z.array(z.string()).min(2).max(7),
    /** Outline markdown for the lesson mindmap (markmap). */
    mindmap: z.string(),
    /** Inventory ids this lesson teaches. */
    covers: z.array(z.string()).min(1),
    /** Which Persian support the body contains (checked by the content linter). */
    persian: z.enum(["full", "tip", "none"]),
    traps: z.array(trap).default([]),
    exercises: z.array(exerciseSchema).min(8),
    recall: z.array(z.object({ q: z.string(), a: z.string() })).min(3),
    cards: z.array(z.object({ front: z.string(), back: z.string() })).min(3),
  }),
})

// --------------------------------------------------------------- inventory

const sourceCode = z.enum([
  "EGP",
  "GSE",
  "CI",
  "GIU",
  "PEU",
  "OEGC",
  "OPG",
  "OMEG",
  "OGEG",
  "OGEAP",
  "LGSWE",
  "LSGSWE",
  "CGEL",
  "LEG",
  "LALG",
])

const inventory = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/inventory" }),
  schema: z.object({
    pillar,
    points: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          title: z.string(),
          level,
          /** Syllabus id of the lesson that teaches it, e.g. "a1-05". */
          lesson: z.string().regex(/^(a1|a2|b1|b2|c1|c2)-\d{2}$/),
          aliases: z.array(z.string()).default([]),
          sources: z.array(sourceCode).default([]),
        }),
      )
      .min(1),
  }),
})

// ---------------------------------------------------------------- syllabus

const syllabus = defineCollection({
  loader: file("./src/content/syllabus/syllabus.yaml"),
  schema: z.object({
    level,
    number: z.number().int().positive(),
    title: z.string(),
    pillar,
    size: z.enum(["core", "mini"]),
  }),
})

// ---------------------------------------------------------------- mindmaps

const mindmaps = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/mindmaps" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["master", "family", "pillar", "level"]),
    description: z.string(),
    order: z.number().default(0),
  }),
})

// ----------------------------------------------------------- decision trees

type TreeNode = {
  q?: string
  answer?: string
  example?: string
  options?: { label: string; next: TreeNode }[]
}

const treeNode: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    q: z.string().optional(),
    answer: z.string().optional(),
    example: z.string().optional(),
    options: z.array(z.object({ label: z.string(), next: treeNode })).optional(),
  }),
)

const trees = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/trees" }),
  schema: z.object({
    title: z.string(),
    pillar,
    description: z.string(),
    root: treeNode,
  }),
})

// --------------------------------------------------------------- reference

const glossary = defineCollection({
  loader: file("./src/content/reference/glossary.yaml"),
  schema: z.object({ term: z.string(), fa: z.string(), meaning: z.string(), example: z.string().optional() }),
})

const irregularVerbs = defineCollection({
  loader: file("./src/content/reference/irregular-verbs.yaml"),
  schema: z.object({ base: z.string(), past: z.string(), participle: z.string(), level, fa: z.string().optional() }),
})

const persianTraps = defineCollection({
  loader: file("./src/content/reference/persian-traps.yaml"),
  schema: z.object({
    group: z.enum(["Sentence structure", "Nouns & determiners", "Pronouns & clauses", "Verbs & tenses", "Verb patterns & reported speech", "Prepositions", "Modifiers"]),
    wrong: z.string(),
    right: z.string(),
    why: z.string(),
    fa: z.string(),
    /** Syllabus id of the lesson that fixes it. */
    lesson: z.string(),
  }),
})

// ------------------------------------------------------------------ audit

const auditSources = defineCollection({
  loader: file("./src/content/audit/sources.yaml"),
  schema: z.object({
    code: sourceCode,
    publisher: z.string(),
    title: z.string(),
    edition: z.string(),
    role: z.string(),
    status: z.enum(["pending", "collected", "mapped"]),
  }),
})

const audits = defineCollection({
  loader: glob({ pattern: ["*.yaml", "!sources.yaml"], base: "./src/content/audit" }),
  schema: z.object({
    source: sourceCode,
    edition: z.string(),
    retrieved_from: z.array(z.string()).default([]),
    verified: z.union([z.boolean(), z.literal("partial")]),
    note: z.string().optional(),
    items: z
      .array(
        z.object({
          ref: z.union([z.string(), z.number()]).optional(),
          level: z.string().optional(),
          item: z.string(),
          maps: z.array(z.string()).default([]),
          outOfScope: z.string().optional(),
          levelNote: z.string().optional(),
          suggest: z.object({ title: z.string(), level: z.string(), lesson: z.string() }).optional(),
        }),
      )
      .default([]),
  }),
})

export const collections = {
  lessons,
  inventory,
  syllabus,
  mindmaps,
  trees,
  glossary,
  irregularVerbs,
  persianTraps,
  auditSources,
  audits,
}
