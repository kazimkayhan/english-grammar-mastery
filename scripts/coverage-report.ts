// pnpm coverage:report: prints the coverage tables used for the audit and writes coverage-report.md.
//  · inventory points per pillar × level
//  · published lessons and the points they teach
//  · per-source audit status: % of each source's checklist items mapped to the inventory
// Exits with code 1 if anything is unplanned, missing or unmapped.
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

import {
  computeCoverage,
  type InventoryPoint,
  type SyllabusItem,
} from "../src/lib/coverage.ts";

const ROOT = join(import.meta.dirname, "../src/content");
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const FRONTMATTER_SEPARATOR = /^---\s*$/mu;
const read = (p: string) => parse(readFileSync(join(ROOT, p), "utf8"));

const points: InventoryPoint[] = readdirSync(join(ROOT, "inventory"))
  .filter((f) => f.endsWith(".yaml"))
  .flatMap((f) => {
    const file = read(`inventory/${f}`);
    return file.points.map((p: Partial<InventoryPoint>) => ({
      ...p,
      aliases: p.aliases ?? [],
      pillar: file.pillar,
      sources: p.sources ?? [],
    }));
  });
const syllabus: SyllabusItem[] = read("syllabus/syllabus.yaml");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) =>
    statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]
  );
const lessons = walk(join(ROOT, "lessons"))
  .filter((p) => p.endsWith(".mdx"))
  .map((p) => {
    const fm = parse(readFileSync(p, "utf8").split(FRONTMATTER_SEPARATOR)[1]);
    return {
      covers: fm.covers ?? [],
      id: p,
      level: fm.level,
      number: fm.number,
    };
  });

const result = computeCoverage(points, syllabus, lessons);
const out: string[] = [];
const line = (s = "") => out.push(s);

line("# Grammar coverage report");
line();
line(
  `Inventory: **${points.length} points** · Syllabus: **${syllabus.length} lessons** · Published: **${lessons.length}** · Points taught so far: **${result.taughtCount}**`
);
line();
line("## Points per pillar × level");
line();
line(`| Pillar | ${LEVELS.join(" | ")} | Total |`);
line(`|---|${LEVELS.map(() => "---:").join("|")}|---:|`);
const pillars = [...new Set(points.map((p) => p.pillar))];
for (const pillar of pillars) {
  const row = LEVELS.map(
    (l) => points.filter((p) => p.pillar === pillar && p.level === l).length
  );
  line(
    `| ${pillar} | ${row.join(" | ")} | ${row.reduce((a, b) => a + b, 0)} |`
  );
}
const totals = LEVELS.map((l) => points.filter((p) => p.level === l).length);
line(`| **Total** | ${totals.join(" | ")} | **${points.length}** |`);
line();

line("## Checks");
line();
const checks: [string, string[]][] = [
  ["Duplicate point ids", result.duplicates],
  [
    "Points without a planned lesson",
    result.unplanned.map((p) => `${p.id} → ${p.lesson}`),
  ],
  [
    "Planned lessons with no points",
    result.emptyLessons.map((s) => `${s.id} ${s.title}`),
  ],
  [
    "Published lessons missing their points",
    result.missing.map((m) => `${m.lesson}: ${m.point.id}`),
  ],
  ["Unknown ids in covers", result.unknown.map((u) => `${u.lesson}: ${u.id}`)],
];
let failed = false;
for (const [name, list] of checks) {
  line(`- ${list.length ? "❌" : "✅"} ${name}: ${list.length}`);
  for (const item of list.slice(0, 20)) {
    line(`  - ${item}`);
  }
  if (list.length) {
    failed = true;
  }
}
line();

line("## Reference audit (Oxford · Longman/Pearson · Cambridge)");
line();
line(
  "| Source | Publisher | Edition used | Verified | Items | Mapped | Out of scope | Unmapped | Coverage |"
);
line("|---|---|---|---|---:|---:|---:|---:|---:|");
const pointIds = new Set(points.map((p) => p.id));

interface AuditItem {
  item: string;
  level?: string;
  maps?: string[];
  outOfScope?: string;
  ref?: string;
  suggest?: { title: string; level: string; lesson: string };
}
interface AuditFile {
  edition: string;
  items?: AuditItem[];
  note?: string;
  retrieved_from?: string[];
  source: string;
  verified: boolean | "partial";
}

const verifiedLabel = (verified: AuditFile["verified"]): string => {
  if (verified === true) {
    return "yes";
  }
  return verified === "partial" ? "partial" : "no";
};

const sources = read("audit/sources.yaml") as {
  code: string;
  publisher: string;
  edition: string;
  status: string;
}[];
const unmappedAll: string[] = [];
const badIds: string[] = [];
for (const s of sources) {
  const file = join(ROOT, `audit/${s.code.toLowerCase()}.yaml`);
  if (!existsSync(file)) {
    line(
      `| ${s.code} | ${s.publisher} | ${s.edition} | – | – | – | – | – | not collected yet |`
    );
    continue;
  }
  const audit = parse(readFileSync(file, "utf8")) as AuditFile;
  const items = audit.items ?? [];
  for (const i of items) {
    for (const id of i.maps ?? []) {
      if (!pointIds.has(id)) {
        badIds.push(`${s.code}: ${id}`);
      }
    }
  }
  const mapped = items.filter(
    (i) => i.maps?.length && i.maps.every((id) => pointIds.has(id))
  ).length;
  const oos = items.filter((i) => !i.maps?.length && i.outOfScope).length;
  const unmapped = items.filter((i) => !(i.maps?.length || i.outOfScope));
  for (const u of unmapped) {
    unmappedAll.push(
      `${s.code} ${u.ref ?? ""} · ${u.item}${u.suggest ? ` → suggest "${u.suggest.title}" (${u.suggest.level}, ${u.suggest.lesson})` : ""}`
    );
  }
  if (unmapped.length || !items.length) {
    failed = true;
  }
  const pct = items.length
    ? Math.round(((mapped + oos) / items.length) * 100)
    : 0;
  line(
    `| ${s.code} | ${s.publisher} | ${audit.edition} | ${verifiedLabel(audit.verified)} | ${items.length} | ${mapped} | ${oos} | ${unmapped.length} | ${items.length ? `${pct}%` : "–"} |`
  );
}
line();
if (badIds.length) {
  failed = true;
  line(`### ❌ Audit items mapped to unknown ids (${badIds.length})`);
  line();
  for (const b of badIds) {
    line(`- ${b}`);
  }
  line();
}
if (unmappedAll.length) {
  line(
    `### Unmapped source items (${unmappedAll.length}): add to the inventory or mark out of scope`
  );
  line();
  for (const u of unmappedAll) {
    line(`- ${u}`);
  }
  line();
}

const report = out.join("\n");
console.log(report);
writeFileSync(
  join(import.meta.dirname, "../coverage-report.md"),
  `${report}\n`
);
process.exit(failed ? 1 : 0);
