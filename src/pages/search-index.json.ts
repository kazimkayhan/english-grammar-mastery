import type { APIRoute } from "astro"
import { getCollection } from "astro:content"

import type { SearchItem } from "@/components/layout/CommandMenu"
import { getCoverage, getInventory, getLessons, getSyllabus } from "@/lib/content"
import { LEVEL_INFO, LEVELS, PILLAR_INFO, PILLARS } from "@/lib/taxonomy"

export const GET: APIRoute = async () => {
  const [lessons, points, syllabus, glossary, { taughtBy }] = await Promise.all([
    getLessons(),
    getInventory(),
    getSyllabus(),
    getCollection("glossary"),
    getCoverage(),
  ])
  const planned = new Map(syllabus.map((s) => [s.id, s]))

  const pages: SearchItem[] = [
    { group: "Pages", title: "Roadmap", href: "/roadmap", keywords: "course plan levels" },
    { group: "Pages", title: "Mindmaps", href: "/mindmaps", keywords: "map recall" },
    { group: "Pages", title: "Flashcards", href: "/flashcards", keywords: "review spaced repetition" },
    { group: "Pages", title: "Practice & Level Checks", href: "/practice", keywords: "exercises test quiz" },
    { group: "Pages", title: "Grammar Tips", href: "/grammar-tips", keywords: "farsi persian mistakes فارسی" },
    { group: "Pages", title: "Grammar index (A–Z)", href: "/grammar-index" },
    { group: "Pages", title: "Reference", href: "/reference", keywords: "irregular verbs tense chart glossary" },
    { group: "Pages", title: "Settings", href: "/settings", keywords: "theme font dark night sepia backup" },
    ...LEVELS.map((l) => ({ group: "Pages" as const, title: `${l} · ${LEVEL_INFO[l].title}`, href: `/levels/${l.toLowerCase()}` })),
    ...PILLARS.map((p) => ({
      group: "Pages" as const,
      title: PILLAR_INFO[p].title,
      subtitle: PILLAR_INFO[p].covers,
      href: `/pillars/${p}`,
    })),
  ]

  const lessonItems: SearchItem[] = lessons.map((l) => ({
    group: "Lessons",
    title: `${l.data.level}.${l.data.number} ${l.data.title}`,
    subtitle: l.data.rule,
    href: `/lessons/${l.id}`,
  }))

  const pointItems: SearchItem[] = points.map((p) => {
    const by = taughtBy.get(p.id) ?? []
    const plan = planned.get(p.lesson)
    return {
      group: "Grammar points",
      title: p.title,
      subtitle: by.length ? `${p.level} · ${PILLAR_INFO[p.pillar as keyof typeof PILLAR_INFO].short}` : `Coming in ${plan?.level}.${plan?.number}`,
      href: by.length ? `/lessons/${by[0]}` : `/pillars/${p.pillar}`,
      keywords: p.aliases.join(" "),
    }
  })

  const glossaryItems: SearchItem[] = glossary.map((g) => ({
    group: "Glossary",
    title: g.data.term,
    subtitle: `${g.data.fa} · ${g.data.meaning}`,
    href: `/reference#glossary`,
  }))

  return new Response(JSON.stringify([...pages, ...lessonItems, ...pointItems, ...glossaryItems]), {
    headers: { "Content-Type": "application/json" },
  })
}
