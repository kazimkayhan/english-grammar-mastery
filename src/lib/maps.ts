// All mindmaps: hand-written ones from src/content/mindmaps plus maps generated from the
// syllabus and inventory (so family, pillar and level maps never drift from the course).
// biome-ignore lint/correctness/noUnresolvedImports: astro:content is a virtual module provided by Astro at build time
import { getCollection } from "astro:content";

import { getInventory, getSyllabus } from "@/lib/content";
import {
  FAMILIES,
  FAMILY_INFO,
  LEVEL_INFO,
  LEVELS,
  type Level,
  PILLAR_INFO,
  PILLARS,
  pillarsOf,
} from "@/lib/taxonomy";

export interface MapEntry {
  branchColors?: string[];
  /** One family colour for the whole map, or one colour per first-level branch. */
  colors: "lesson" | "branches";
  colorVar?: string;
  description: string;
  id: string;
  kind: "master" | "family" | "pillar" | "level";
  markdown: string;
  order: number;
  title: string;
}

const familyVar = (family: string) => `--fam-${family}`;

export async function getAllMaps(): Promise<MapEntry[]> {
  const [written, syllabus, points] = await Promise.all([
    getCollection("mindmaps"),
    getSyllabus(),
    getInventory(),
  ]);
  const maps: MapEntry[] = written.map((m) => ({
    // The master map's first-level branches are the four families, in order.
    branchColors:
      m.data.kind === "master" ? FAMILIES.map(familyVar) : undefined,
    colors: "branches",
    description: m.data.description,
    id: m.id,
    kind: m.data.kind,
    markdown: m.body ?? "",
    order: m.data.order,
    title: m.data.title,
  }));
  const has = new Set(maps.map((m) => m.id));

  FAMILIES.forEach((family, i) => {
    const id = `family-${family}`;
    if (has.has(id)) {
      return;
    }
    const fam = FAMILY_INFO[family];
    const lines = [`# ${fam.title}`];
    for (const p of pillarsOf(family)) {
      lines.push(`## ${p.number} ${p.short}`);
      for (const level of LEVELS) {
        const lessons = syllabus.filter(
          (s) => s.pillar === p.id && s.level === level
        );
        if (!lessons.length) {
          continue;
        }
        lines.push(`### ${level}`);
        for (const s of lessons) {
          lines.push(`- ${s.title}`);
        }
      }
    }
    maps.push({
      colors: "lesson",
      colorVar: familyVar(family),
      description: fam.tagline,
      id,
      kind: "family",
      markdown: lines.join("\n"),
      order: 10 + i,
      title: `${fam.title}: the family map`,
    });
  });

  for (const pillar of PILLARS) {
    const id = `pillar-${pillar}`;
    if (has.has(id)) {
      continue;
    }
    const info = PILLAR_INFO[pillar];
    const lines = [`# ${info.number} ${info.title}`];
    for (const level of LEVELS) {
      const list = points.filter(
        (p) => p.pillar === pillar && p.level === level
      );
      if (!list.length) {
        continue;
      }
      lines.push(`## ${level}`);
      for (const p of list) {
        lines.push(`- ${p.title}`);
      }
    }
    maps.push({
      colors: "lesson",
      colorVar: familyVar(info.family),
      description: info.covers,
      id,
      kind: "pillar",
      markdown: lines.join("\n"),
      order: 20 + info.number,
      title: `${info.title} from A1 to C2`,
    });
  }

  LEVELS.forEach((level: Level, i) => {
    const id = `level-${level.toLowerCase()}`;
    if (has.has(id)) {
      return;
    }
    const lines = [`# ${level} · ${LEVEL_INFO[level].title}`];
    const branchColors: string[] = [];
    for (const family of FAMILIES) {
      const pillars = pillarsOf(family).filter((p) =>
        syllabus.some((s) => s.level === level && s.pillar === p.id)
      );
      if (!pillars.length) {
        continue;
      }
      lines.push(`## ${FAMILY_INFO[family].title}`);
      branchColors.push(familyVar(family));
      for (const p of pillars) {
        lines.push(`### ${p.short}`);
        for (const s of syllabus.filter(
          (x) => x.level === level && x.pillar === p.id
        )) {
          lines.push(`- ${s.title}`);
        }
      }
    }
    maps.push({
      branchColors,
      colors: "branches",
      description: LEVEL_INFO[level].canDo,
      id,
      kind: "level",
      markdown: lines.join("\n"),
      order: 40 + i,
      title: `${level}: what's new`,
    });
  });

  return maps.sort((a, b) => a.order - b.order);
}

export async function getMap(id: string): Promise<MapEntry | undefined> {
  return (await getAllMaps()).find((m) => m.id === id);
}
