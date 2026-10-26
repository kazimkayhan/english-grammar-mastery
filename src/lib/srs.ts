import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs"

import { db, type FlashcardRow } from "@/lib/db"

export { Rating }

export const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }))

export interface LessonCards {
  lessonId: string
  lessonTitle: string
  level: string
  pillar: string
  cards: { front: string; back: string }[]
}

export const cardId = (lessonId: string, index: number) => `${lessonId}#${index}`

/** Adds a lesson's cards; cards already in the deck keep their schedule. */
export async function addLessonCards(lesson: LessonCards, now = new Date()): Promise<number> {
  const ids = lesson.cards.map((_, i) => cardId(lesson.lessonId, i))
  const existing = new Set((await db.cards.bulkGet(ids)).filter(Boolean).map((row) => row!.id))
  const rows: FlashcardRow[] = lesson.cards
    .map((c, i) => ({ c, id: ids[i] }))
    .filter(({ id }) => !existing.has(id))
    .map(({ c, id }) => {
      const card = createEmptyCard(now)
      return {
        id,
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        level: lesson.level,
        pillar: lesson.pillar,
        front: c.front,
        back: c.back,
        card,
        due: card.due.getTime(),
        addedAt: now.getTime(),
      }
    })
  await db.cards.bulkPut(rows)
  return rows.length
}

export async function removeLessonCards(lessonId: string) {
  await db.cards.where("lessonId").equals(lessonId).delete()
}

export function startOfToday(now = new Date()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Today's queue: every card due now, but at most `newPerDay` brand-new cards.
 * New cards are introduced in the order they were added.
 */
export async function reviewQueue(newPerDay: number, now = new Date()): Promise<FlashcardRow[]> {
  const due = await db.cards.where("due").belowOrEqual(now.getTime()).toArray()
  const learned = due.filter((r) => r.card.state !== State.New).sort((a, b) => a.due - b.due)
  const fresh = due.filter((r) => r.card.state === State.New).sort((a, b) => a.addedAt - b.addedAt)
  return [...learned, ...fresh.slice(0, Math.max(0, newPerDay))]
}

export async function countDue(newPerDay: number, now = new Date()) {
  return (await reviewQueue(newPerDay, now)).length
}

/** Dexie returns plain objects; make sure dates are Date instances for ts-fsrs. */
export function hydrateCard(card: Card): Card {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  }
}

export async function rate(row: FlashcardRow, grade: Grade, now = new Date()): Promise<FlashcardRow> {
  const { card } = scheduler.next(hydrateCard(row.card), now, grade)
  const next = { ...row, card, due: card.due.getTime() }
  await db.cards.put(next)
  return next
}

/** Human label for the next interval of each grade, e.g. "10m", "3d". */
export function previewIntervals(row: FlashcardRow, now = new Date()): Record<Grade, string> {
  const preview = scheduler.repeat(hydrateCard(row.card), now)
  const label = (due: Date) => {
    const mins = Math.max(1, Math.round((due.getTime() - now.getTime()) / 60000))
    if (mins < 60) return `${mins}m`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.round(hours / 24)
    if (days < 31) return `${days}d`
    const months = Math.round(days / 30)
    return months < 12 ? `${months}mo` : `${Math.round(months / 12)}y`
  }
  return {
    [Rating.Again]: label(preview[Rating.Again].card.due),
    [Rating.Hard]: label(preview[Rating.Hard].card.due),
    [Rating.Good]: label(preview[Rating.Good].card.due),
    [Rating.Easy]: label(preview[Rating.Easy].card.due),
  } as Record<Grade, string>
}

// ------------------------------------------------------------ backup

export interface Backup {
  app: "english-grammar-mastery"
  version: 1
  exportedAt: string
  cards: FlashcardRow[]
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: "english-grammar-mastery",
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: await db.cards.toArray(),
  }
}

export async function importBackup(data: unknown): Promise<number> {
  const backup = data as Partial<Backup>
  if (backup?.app !== "english-grammar-mastery" || !Array.isArray(backup.cards)) {
    throw new Error("This file is not an English Grammar Mastery backup.")
  }
  const rows = backup.cards.map((r) => ({ ...r, card: hydrateCard(r.card) }))
  await db.cards.bulkPut(rows)
  return rows.length
}
