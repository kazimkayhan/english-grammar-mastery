# English Grammar Mastery

A complete English **grammar** course from **A1 to C2**: 250 short lessons, mindmaps, real-life examples, Persian support that fades as the learner grows, exercises with instant feedback, and spaced-repetition flashcards. No grammar point is left out: every point lives in an inventory that is checked against Cambridge, Oxford and Longman/Pearson reference grammars.

Built with Astro 7, React 19 islands, MDX, Tailwind CSS 4 and shadcn/ui (Base UI). Everything runs in the browser; the only stored data is the learner's flashcards (IndexedDB) and settings (localStorage).

## Run it

```sh
pnpm install
pnpm dev               # http://localhost:4321
pnpm build && pnpm preview
```

## Checks

| Command | What it does |
| --- | --- |
| `pnpm check` | Type-checks everything (Astro + TypeScript) |
| `pnpm test` | Unit tests, the **content linter** and the **coverage test** (no grammar point may be unplanned or untaught by its published lesson) |
| `pnpm test:e2e` | Playwright tests in Microsoft Edge against the production build (run `pnpm build` first) |
| `pnpm coverage:report` | Writes `coverage-report.md`: points per pillar × level, and how each reference source maps to the inventory |

## How the content is organised

```text
src/content/
  syllabus/syllabus.yaml     the 250 planned lessons (id a1-05, level, number, title, pillar, size)
  inventory/<pillar>.yaml    every grammar point (879), each assigned to a planned lesson
  lessons/<level>/NN-*.mdx   the written lessons (one file per syllabus entry)
  mindmaps/*.md              master / family / pillar / level mindmaps (outline Markdown)
  trees/*.yaml               decision trees ("a, an, the or no article?")
  reference/*.yaml           irregular verbs, EN–FA glossary, Grammar Tips traps
  audit/*.yaml               reference sources and their mapped checklists
```

Grammar is organised as **4 families** (Words → Verbs → Sentences → Text) and **16 pillars**; see `src/lib/taxonomy.ts`.

## Writing a lesson

Copy `src/content/lessons/a1/05-be-am-is-are.mdx`. Every lesson follows the same 10 steps, enforced by the schema in `src/content.config.ts` and by `tests/unit/content-lint.test.ts`:

1. `hook`: a one-line real-life situation
2. `rule`: the rule in one sentence
3. `mindmap`: outline Markdown (`# root`, `## branch`, `- leaf`)
4. form table / `<Timeline>` in the body
5. uses with `<Example context="work" fa="…">` sentences
6. Persian support: `<Persian>` (A1–A2, full) or `<Persian kind="tip">` (B1–B2); none at C1–C2. `traps:` adds Grammar Tips ✗ → ✓ items
7. common mistakes: `<WrongRight wrong="…" right="…" why="…" />`
8. `<MemoryHook>`
9. `exercises:` at least 8, at least 3 types (`mcq`, `gap`, `correct`, `reorder`, `transform`, `match`)
10. `recall:` (3+) and `cards:` (3+) for flashcards

`covers:` must list the inventory ids assigned to the lesson's syllabus entry; the coverage test fails otherwise.

The course uses **American English**; mark British differences with `<UkNote>`. English text inside Persian blocks is bidi-isolated automatically.
