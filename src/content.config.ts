// biome-ignore lint/correctness/noUnresolvedImports: astro:content is a virtual module provided by Astro at build time
import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

import { LEVELS, PILLARS } from "@/lib/taxonomy";

const level = z.enum(LEVELS);
const pillar = z.enum(PILLARS);

// ---------------------------------------------------------------- exercises

const explain = z.string().min(1);

const mcq = z.object({
  answer: z.number().int().min(0),
  explain,
  options: z.array(z.string()).min(2),
  prompt: z.string(),
  type: z.literal("mcq"),
});

const gap = z.object({
  answers: z.array(z.string()).min(1),
  /** Optional word in brackets, e.g. (go) or a base word for word formation. */
  base: z.string().optional(),
  explain,
  /** Use ___ for the blank. */
  prompt: z.string().includes("___"),
  /** Capitals and final punctuation count. */
  strict: z.boolean().optional(),
  type: z.literal("gap"),
});

const correct = z.object({
  answers: z.array(z.string()).min(1),
  explain,
  /** A sentence with one mistake (or missing punctuation). */
  prompt: z.string(),
  /** Capitals and final punctuation count (punctuation lessons). */
  strict: z.boolean().optional(),
  type: z.literal("correct"),
});

const reorder = z.object({
  /** Other accepted orders, written as full sentences. */
  alternatives: z.array(z.string()).optional(),
  /** The correct sentence, split into chunks; they are shuffled on screen. */
  chunks: z.array(z.string()).min(3),
  explain,
  type: z.literal("reorder"),
});

const transform = z.object({
  answers: z.array(z.string()).min(1),
  explain,
  keyword: z.string().optional(),
  prompt: z.string(),
  start: z.string().optional(),
  type: z.literal("transform"),
});

const match = z.object({
  explain,
  pairs: z.array(z.tuple([z.string(), z.string()])).min(2),
  prompt: z.string(),
  type: z.literal("match"),
});

export const exerciseSchema = z.discriminatedUnion("type", [
  mcq,
  gap,
  correct,
  reorder,
  transform,
  match,
]);

// ----------------------------------------------------------------- lessons

const trap = z.object({
  /** Persian note (shown per the Persian setting). */
  fa: z.string().optional(),
  right: z.string(),
  why: z.string(),
  wrong: z.string(),
});

const lessons = defineCollection({
  loader: glob({ base: "./src/content/lessons", pattern: "**/*.mdx" }),
  schema: z.object({
    cards: z.array(z.object({ back: z.string(), front: z.string() })).min(3),
    /** Inventory ids this lesson teaches. */
    covers: z.array(z.string()).min(1),
    exercises: z.array(exerciseSchema).min(8),
    /** One-line real-life situation that opens the lesson. */
    hook: z.string(),
    level,
    /** Outline markdown for the lesson mindmap (markmap). */
    mindmap: z.string(),
    number: z.number().int().positive(),
    /** Which Persian support the body contains (checked by the content linter). */
    persian: z.enum(["full", "tip", "none"]),
    pillar,
    /** At most seven key points: the one-screen summary card. */
    points: z.array(z.string()).min(2).max(7),
    recall: z.array(z.object({ a: z.string(), q: z.string() })).min(3),
    /** The rule in one sentence. */
    rule: z.string(),
    size: z.enum(["core", "mini"]),
    title: z.string(),
    traps: z.array(trap).default([]),
  }),
});

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
]);

const inventory = defineCollection({
  loader: glob({ base: "./src/content/inventory", pattern: "*.yaml" }),
  schema: z.object({
    pillar,
    points: z
      .array(
        z.object({
          aliases: z.array(z.string()).default([]),
          id: z.string().regex(/^[a-z0-9-]+$/u),
          /** Syllabus id of the lesson that teaches it, e.g. "a1-05". */
          lesson: z.string().regex(/^(?<level>a1|a2|b1|b2|c1|c2)-\d{2}$/u),
          level,
          sources: z.array(sourceCode).default([]),
          title: z.string(),
        })
      )
      .min(1),
  }),
});

// ---------------------------------------------------------------- syllabus

const syllabus = defineCollection({
  loader: file("./src/content/syllabus/syllabus.yaml"),
  schema: z.object({
    level,
    number: z.number().int().positive(),
    pillar,
    size: z.enum(["core", "mini"]),
    title: z.string(),
  }),
});

// ---------------------------------------------------------------- mindmaps

const mindmaps = defineCollection({
  loader: glob({ base: "./src/content/mindmaps", pattern: "*.md" }),
  schema: z.object({
    description: z.string(),
    kind: z.enum(["master", "family", "pillar", "level"]),
    order: z.number().default(0),
    title: z.string(),
  }),
});

// ----------------------------------------------------------- decision trees

interface TreeNode {
  answer?: string;
  example?: string;
  options?: { label: string; next: TreeNode }[];
  q?: string;
}

const treeNode: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    answer: z.string().optional(),
    example: z.string().optional(),
    options: z
      .array(z.object({ label: z.string(), next: treeNode }))
      .optional(),
    q: z.string().optional(),
  })
);

const trees = defineCollection({
  loader: glob({ base: "./src/content/trees", pattern: "*.yaml" }),
  schema: z.object({
    description: z.string(),
    pillar,
    root: treeNode,
    title: z.string(),
  }),
});

// --------------------------------------------------------------- reference

const glossary = defineCollection({
  loader: file("./src/content/reference/glossary.yaml"),
  schema: z.object({
    example: z.string().optional(),
    fa: z.string(),
    meaning: z.string(),
    term: z.string(),
  }),
});

const irregularVerbs = defineCollection({
  loader: file("./src/content/reference/irregular-verbs.yaml"),
  schema: z.object({
    base: z.string(),
    fa: z.string().optional(),
    level,
    participle: z.string(),
    past: z.string(),
  }),
});

const persianTraps = defineCollection({
  loader: file("./src/content/reference/persian-traps.yaml"),
  schema: z.object({
    fa: z.string(),
    group: z.enum([
      "Sentence structure",
      "Nouns & determiners",
      "Pronouns & clauses",
      "Verbs & tenses",
      "Verb patterns & reported speech",
      "Prepositions",
      "Modifiers",
    ]),
    /** Syllabus id of the lesson that fixes it. */
    lesson: z.string(),
    right: z.string(),
    why: z.string(),
    wrong: z.string(),
  }),
});

// ------------------------------------------------------------------ audit

const auditSources = defineCollection({
  loader: file("./src/content/audit/sources.yaml"),
  schema: z.object({
    code: sourceCode,
    edition: z.string(),
    publisher: z.string(),
    role: z.string(),
    status: z.enum(["pending", "collected", "mapped"]),
    title: z.string(),
  }),
});

const audits = defineCollection({
  loader: glob({
    base: "./src/content/audit",
    pattern: ["*.yaml", "!sources.yaml"],
  }),
  schema: z.object({
    edition: z.string(),
    items: z
      .array(
        z.object({
          item: z.string(),
          level: z.string().optional(),
          levelNote: z.string().optional(),
          maps: z.array(z.string()).default([]),
          outOfScope: z.string().optional(),
          ref: z.union([z.string(), z.number()]).optional(),
          suggest: z
            .object({
              lesson: z.string(),
              level: z.string(),
              title: z.string(),
            })
            .optional(),
        })
      )
      .default([]),
    note: z.string().optional(),
    retrieved_from: z.array(z.string()).default([]),
    source: sourceCode,
    verified: z.union([z.boolean(), z.literal("partial")]),
  }),
});

export const collections = {
  auditSources,
  audits,
  glossary,
  inventory,
  irregularVerbs,
  lessons,
  mindmaps,
  persianTraps,
  syllabus,
  trees,
};
