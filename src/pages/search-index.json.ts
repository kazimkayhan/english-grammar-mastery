// biome-ignore lint/correctness/noUnresolvedImports: astro:content is a virtual module provided by Astro at build time
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

import type { SearchItem } from "@/components/layout/command-menu";
import {
  getCoverage,
  getInventory,
  getLessons,
  getSyllabus,
} from "@/lib/content";
import { LEVEL_INFO, LEVELS, PILLAR_INFO, PILLARS } from "@/lib/taxonomy";

export const GET: APIRoute = async () => {
  const [lessons, points, syllabus, glossary, { taughtBy }] = await Promise.all(
    [
      getLessons(),
      getInventory(),
      getSyllabus(),
      getCollection("glossary"),
      getCoverage(),
    ]
  );
  const planned = new Map(syllabus.map((s) => [s.id, s]));

  const pages: SearchItem[] = [
    {
      group: "Pages",
      href: "/roadmap",
      keywords: "course plan levels",
      title: "Roadmap",
    },
    {
      group: "Pages",
      href: "/mindmaps",
      keywords: "map recall",
      title: "Mindmaps",
    },
    {
      group: "Pages",
      href: "/flashcards",
      keywords: "review spaced repetition",
      title: "Flashcards",
    },
    {
      group: "Pages",
      href: "/practice",
      keywords: "exercises test quiz",
      title: "Practice & Level Checks",
    },
    {
      group: "Pages",
      href: "/grammar-tips",
      keywords: "farsi persian mistakes فارسی",
      title: "Grammar Tips",
    },
    { group: "Pages", href: "/grammar-index", title: "Grammar index (A–Z)" },
    {
      group: "Pages",
      href: "/reference",
      keywords: "irregular verbs tense chart glossary",
      title: "Reference",
    },
    {
      group: "Pages",
      href: "/settings",
      keywords: "theme font dark night sepia backup",
      title: "Settings",
    },
    ...LEVELS.map((l) => ({
      group: "Pages" as const,
      href: `/levels/${l.toLowerCase()}`,
      title: `${l} · ${LEVEL_INFO[l].title}`,
    })),
    ...PILLARS.map((p) => ({
      group: "Pages" as const,
      href: `/pillars/${p}`,
      subtitle: PILLAR_INFO[p].covers,
      title: PILLAR_INFO[p].title,
    })),
  ];

  const lessonItems: SearchItem[] = lessons.map((l) => ({
    group: "Lessons",
    href: `/lessons/${l.id}`,
    subtitle: l.data.rule,
    title: `${l.data.level}.${l.data.number} ${l.data.title}`,
  }));

  const pointItems: SearchItem[] = points.map((p) => {
    const by = taughtBy.get(p.id) ?? [];
    const plan = planned.get(p.lesson);
    return {
      group: "Grammar points",
      href: by.length ? `/lessons/${by[0]}` : `/pillars/${p.pillar}`,
      keywords: p.aliases.join(" "),
      subtitle: by.length
        ? `${p.level} · ${PILLAR_INFO[p.pillar as keyof typeof PILLAR_INFO].short}`
        : `Coming in ${plan?.level}.${plan?.number}`,
      title: p.title,
    };
  });

  const glossaryItems: SearchItem[] = glossary.map((g) => ({
    group: "Glossary",
    href: "/reference#glossary",
    subtitle: `${g.data.fa} · ${g.data.meaning}`,
    title: g.data.term,
  }));

  return Response.json([
    ...pages,
    ...lessonItems,
    ...pointItems,
    ...glossaryItems,
  ]);
};
