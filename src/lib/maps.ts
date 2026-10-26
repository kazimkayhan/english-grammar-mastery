// All mindmaps: hand-written ones from src/content/mindmaps plus maps generated from the
// syllabus and inventory (so family, pillar and level maps never drift from the course).
import { getCollection } from "astro:content"

import { getInventory, getSyllabus } from "@/lib/content"
import { FAMILIES, FAMILY_INFO, LEVEL_INFO, LEVELS, PILLAR_INFO, PILLARS, pillarsOf, type Level } from "@/lib/taxonomy"

export interface MapEntry {
  id: string
  title: string
  kind: "master" | "family" | "pillar" | "level"
  description: string
  markdown: string
  order: number
  /** One family colour for the whole map, or one colour per first-level branch. */
  colors: "lesson" | "branches"
  colorVar?: string
  branchColors?: string[]
}

const familyVar = (family: string) => `--fam-${family}`

export async function getAllMaps(): Promise<MapEntry[]> {
  const [written, syllabus, points] = await Promise.all([getCollection("mindmaps"), getSyllabus(), getInventory()])
  const maps: MapEntry[] = written.map((m) => ({
    id: m.id,
    title: m.data.title,
    kind: m.data.kind,
    description: m.data.description,
    markdown: m.body ?? "",
    order: m.data.order,
    colors: "branches",
    // The master map's first-level branches are the four families, in order.
    branchColors: m.data.kind === "master" ? FAMILIES.map(familyVar) : undefined,
  }))
  const has = new Set(maps.map((m) => m.id))

  FAMILIES.forEach((family, i) => {
    const id = `family-${family}`
    if (has.has(id)) return
    const fam = FAMILY_INFO[family]
    const lines = [`# ${fam.title}`]
    for (const p of pillarsOf(family)) {
      lines.push(`## ${p.number} ${p.short}`)
      for (const level of LEVELS) {
        const lessons = syllabus.filter((s) => s.pillar === p.id && s.level === level)
        if (!lessons.length) continue
        lines.push(`### ${level}`)
        for (const s of lessons) lines.push(`- ${s.title}`)
      }
    }
    maps.push({
      id,
      title: `${fam.title}: the family map`,
      kind: "family",
      description: fam.tagline,
      markdown: lines.join("\n"),
      order: 10 + i,
      colors: "lesson",
      colorVar: familyVar(family),
    })
  })

  PILLARS.forEach((pillar) => {
    const id = `pillar-${pillar}`
    if (has.has(id)) return
    const info = PILLAR_INFO[pillar]
    const lines = [`# ${info.number} ${info.title}`]
    for (const level of LEVELS) {
      const list = points.filter((p) => p.pillar === pillar && p.level === level)
      if (!list.length) continue
      lines.push(`## ${level}`)
      for (const p of list) lines.push(`- ${p.title}`)
    }
    maps.push({
      id,
      title: `${info.title} from A1 to C2`,
      kind: "pillar",
      description: info.covers,
      markdown: lines.join("\n"),
      order: 20 + info.number,
      colors: "lesson",
      colorVar: familyVar(info.family),
    })
  })

  LEVELS.forEach((level: Level, i) => {
    const id = `level-${level.toLowerCase()}`
    if (has.has(id)) return
    const lines = [`# ${level} · ${LEVEL_INFO[level].title}`]
    const branchColors: string[] = []
    for (const family of FAMILIES) {
      const pillars = pillarsOf(family).filter((p) => syllabus.some((s) => s.level === level && s.pillar === p.id))
      if (!pillars.length) continue
      lines.push(`## ${FAMILY_INFO[family].title}`)
      branchColors.push(familyVar(family))
      for (const p of pillars) {
        lines.push(`### ${p.short}`)
        for (const s of syllabus.filter((x) => x.level === level && x.pillar === p.id)) lines.push(`- ${s.title}`)
      }
    }
    maps.push({
      id,
      title: `${level}: what's new`,
      kind: "level",
      description: LEVEL_INFO[level].canDo,
      markdown: lines.join("\n"),
      order: 40 + i,
      colors: "branches",
      branchColors,
    })
  })

  return maps.sort((a, b) => a.order - b.order)
}

export async function getMap(id: string): Promise<MapEntry | undefined> {
  return (await getAllMaps()).find((m) => m.id === id)
}
