// Fill each inventory point's `sources` from the audit files: the list of reference works
// whose checklist items map to that point. Re-run after any audit change.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, parseDocument } from "yaml";

const ROOT = join(import.meta.dirname, "../src/content");
const ORDER = [
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
];

const sourcesOf = new Map();
for (const f of readdirSync(join(ROOT, "audit")).filter(
  (name) => name !== "sources.yaml"
)) {
  const audit = parse(readFileSync(join(ROOT, "audit", f), "utf8"));
  for (const item of audit.items ?? []) {
    for (const id of item.maps ?? []) {
      if (!sourcesOf.has(id)) {
        sourcesOf.set(id, new Set());
      }
      sourcesOf.get(id).add(audit.source);
    }
  }
}

let withSource = 0;
let total = 0;
for (const f of readdirSync(join(ROOT, "inventory"))) {
  const path = join(ROOT, "inventory", f);
  const doc = parseDocument(readFileSync(path, "utf8"));
  for (const node of doc.get("points").items) {
    total += 1;
    const found = [...(sourcesOf.get(node.get("id")) ?? [])].sort(
      (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
    );
    if (found.length) {
      withSource += 1;
    }
    node.set("sources", doc.createNode(found, { flow: true }));
  }
  writeFileSync(path, doc.toString({ lineWidth: 0 }));
}
console.log(
  `${withSource} of ${total} points are listed by at least one reference source`
);
