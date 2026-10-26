import * as React from "react"
import { liveQuery } from "dexie"
import { useStore } from "@nanostores/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cards01Icon, CheckmarkCircle02Icon, Delete02Icon, ViewIcon } from "@hugeicons/core-free-icons"

import { MixedText } from "@/components/common/MixedText"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db, type FlashcardRow } from "@/lib/db"
import { previewIntervals, rate, Rating, removeLessonCards, reviewQueue } from "@/lib/srs"
import { $settings } from "@/stores/settings"

const GRADES = [
  { grade: Rating.Again, label: "Again", key: "1", hint: "I forgot" },
  { grade: Rating.Hard, label: "Hard", key: "2", hint: "Slow, with effort" },
  { grade: Rating.Good, label: "Good", key: "3", hint: "I remembered" },
  { grade: Rating.Easy, label: "Easy", key: "4", hint: "Instantly" },
] as const

export function FlashcardReview() {
  const { newCardsPerDay } = useStore($settings)
  const [queue, setQueue] = React.useState<FlashcardRow[] | null>(null)
  const [revealed, setRevealed] = React.useState(false)
  const [reviewed, setReviewed] = React.useState(0)

  const load = React.useCallback(async () => {
    setQueue(await reviewQueue(newCardsPerDay))
    setRevealed(false)
  }, [newCardsPerDay])

  React.useEffect(() => {
    load()
  }, [load])

  const current = queue?.[0]
  const intervals = React.useMemo(() => (current ? previewIntervals(current) : null), [current])

  const answer = React.useCallback(
    async (grade: (typeof GRADES)[number]["grade"]) => {
      if (!current) return
      const next = await rate(current, grade)
      setReviewed((n) => n + 1)
      setRevealed(false)
      setQueue((q) => {
        if (!q) return q
        const rest = q.slice(1)
        // Cards due again within the session (e.g. "Again" → 1 minute) go to the back of the queue.
        return next.due <= Date.now() + 10 * 60_000 ? [...rest, next] : rest
      })
    },
    [current],
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!current) return
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault()
        setRevealed(true)
        return
      }
      const g = GRADES.find((x) => x.key === e.key)
      if (revealed && g) {
        e.preventDefault()
        answer(g.grade)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current, revealed, answer])

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4" aria-label="Review">
        {queue === null ? (
          <p className="text-muted-foreground">Loading your cards…</p>
        ) : current ? (
          <Card className="min-h-80">
            <CardHeader>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{current.level}</Badge>
                <a className="truncate hover:underline" href={`/lessons/${current.lessonId}`}>
                  {current.lessonTitle}
                </a>
                <span className="ml-auto tabular-nums">{queue.length} left</span>
              </CardDescription>
              <CardTitle className="pt-6 text-center font-reading text-2xl leading-snug text-balance sm:text-3xl">
                <MixedText text={current.front} />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
              {revealed ? (
                <p className="max-w-prose rounded-2xl bg-muted px-6 py-4 text-center font-reading text-xl text-balance">
                  <MixedText text={current.back} />
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Answer in your head first.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {revealed ? (
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  {GRADES.map((g) => (
                    <Button
                      key={g.label}
                      size="lg"
                      variant={g.grade === Rating.Good ? "default" : "outline"}
                      onClick={() => answer(g.grade)}
                      className="h-auto flex-col py-2"
                    >
                      <span>{g.label}</span>
                      <span className="text-xs opacity-75">
                        {intervals?.[g.grade]}
                        <Kbd className="ml-1 hidden sm:inline-flex">{g.key}</Kbd>
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" onClick={() => setRevealed(true)}>
                  <HugeiconsIcon icon={ViewIcon} strokeWidth={2} data-icon="inline-start" />
                  Show answer <Kbd className="hidden sm:inline-flex">Space</Kbd>
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={reviewed ? CheckmarkCircle02Icon : Cards01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>{reviewed ? "All done for now!" : "No cards due"}</EmptyTitle>
              <EmptyDescription>
                {reviewed
                  ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. Come back tomorrow.`
                  : "Open any lesson and press “Add to my flashcards” at the end."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<a href="/roadmap" />} nativeButton={false}>
                Go to the roadmap
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </section>
      <DeckList />
    </div>
  )
}

function DeckList() {
  const [rows, setRows] = React.useState<FlashcardRow[] | null>(null)

  React.useEffect(() => {
    const sub = liveQuery(() => db.cards.toArray()).subscribe({ next: setRows, error: () => setRows([]) })
    return () => sub.unsubscribe()
  }, [])

  if (!rows?.length) return null

  const decks = Object.values(
    rows.reduce<Record<string, { lessonId: string; title: string; level: string; count: number; due: number }>>(
      (acc, r) => {
        const d = (acc[r.lessonId] ??= { lessonId: r.lessonId, title: r.lessonTitle, level: r.level, count: 0, due: 0 })
        d.count += 1
        if (r.due <= Date.now()) d.due += 1
        return acc
      },
      {},
    ),
  ).sort((a, b) => a.lessonId.localeCompare(b.lessonId))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="decks-title">
      <h2 id="decks-title" className="font-heading text-xl font-bold">
        Your decks
      </h2>
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lesson</TableHead>
              <TableHead className="text-right">Cards</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead className="sr-only">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decks.map((d) => (
              <TableRow key={d.lessonId}>
                <TableCell>
                  <a href={`/lessons/${d.lessonId}`} className="hover:underline">
                    <Badge variant="outline" className="mr-2">
                      {d.level}
                    </Badge>
                    {d.title}
                  </a>
                </TableCell>
                <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                <TableCell className="text-right tabular-nums">{d.due}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${d.title} cards`}
                    onClick={() => removeLessonCards(d.lessonId)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

export default FlashcardReview
