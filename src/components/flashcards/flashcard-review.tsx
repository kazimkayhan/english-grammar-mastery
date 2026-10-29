import {
  Cards01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@nanostores/react";
import { liveQuery } from "dexie";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Rating } from "ts-fsrs";

import { MixedText } from "@/components/common/mixed-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Kbd } from "@/components/ui/kbd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db, type FlashcardRow } from "@/lib/db";
import {
  previewIntervals,
  rate,
  removeLessonCards,
  reviewQueue,
} from "@/lib/srs";
import { $settings } from "@/stores/settings";

const GRADES = [
  { grade: Rating.Again, hint: "I forgot", key: "1", label: "Again" },
  { grade: Rating.Hard, hint: "Slow, with effort", key: "2", label: "Hard" },
  { grade: Rating.Good, hint: "I remembered", key: "3", label: "Good" },
  { grade: Rating.Easy, hint: "Instantly", key: "4", label: "Easy" },
] as const;

type Grade = (typeof GRADES)[number]["grade"];

export function FlashcardReview() {
  const { newCardsPerDay } = useStore($settings);
  const [queue, setQueue] = useState<FlashcardRow[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const load = useCallback(async () => {
    setQueue(await reviewQueue(newCardsPerDay));
    setRevealed(false);
  }, [newCardsPerDay]);

  useEffect(() => {
    load();
  }, [load]);

  const current = queue?.[0];

  const answer = useCallback(
    async (grade: Grade) => {
      if (!current) {
        return;
      }
      const next = await rate(current, grade);
      setReviewed((n) => n + 1);
      setRevealed(false);
      setQueue((q) => {
        if (!q) {
          return q;
        }
        const rest = q.slice(1);
        // Cards due again within the session (e.g. "Again" → 1 minute) go to the back of the queue.
        return next.due <= Date.now() + 10 * 60_000 ? [...rest, next] : rest;
      });
    },
    [current]
  );

  useReviewKeyboard({ answer, current, revealed, setRevealed });

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Review" className="flex flex-col gap-4">
        {queue === null ? (
          <p className="text-muted-foreground">Loading your cards…</p>
        ) : null}
        {queue !== null && current ? (
          <ReviewCard
            current={current}
            onAnswer={answer}
            onReveal={() => setRevealed(true)}
            remaining={queue.length}
            revealed={revealed}
          />
        ) : null}
        {queue !== null && !current ? (
          <EmptyReview reviewed={reviewed} />
        ) : null}
      </section>
      <DeckList />
    </div>
  );
}

function useReviewKeyboard({
  answer,
  current,
  revealed,
  setRevealed,
}: {
  answer: (grade: Grade) => void;
  current: FlashcardRow | undefined;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (!current) {
        return;
      }
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      const g = GRADES.find((x) => x.key === e.key);
      if (revealed && g) {
        e.preventDefault();
        answer(g.grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, answer, setRevealed]);
}

function ReviewCard({
  current,
  remaining,
  revealed,
  onAnswer,
  onReveal,
}: {
  current: FlashcardRow;
  remaining: number;
  revealed: boolean;
  onAnswer: (grade: Grade) => void;
  onReveal: () => void;
}) {
  const intervals = useMemo(() => previewIntervals(current), [current]);

  return (
    <Card className="min-h-80">
      <CardHeader>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{current.level}</Badge>
          <a
            className="truncate hover:underline"
            href={`/lessons/${current.lessonId}`}
          >
            {current.lessonTitle}
          </a>
          <span className="ml-auto tabular-nums">{remaining} left</span>
        </CardDescription>
        <CardTitle className="font-reading pt-6 text-center text-2xl leading-snug text-balance sm:text-3xl">
          <MixedText text={current.front} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        {revealed ? (
          <p className="bg-muted font-reading max-w-prose rounded-2xl px-6 py-4 text-center text-xl text-balance">
            <MixedText text={current.back} />
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Answer in your head first.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {revealed ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <Button
                className="h-auto flex-col py-2"
                key={g.label}
                onClick={() => onAnswer(g.grade)}
                size="lg"
                variant={g.grade === Rating.Good ? "default" : "outline"}
              >
                <span>{g.label}</span>
                <span className="text-xs opacity-75">
                  {intervals[g.grade]}
                  <Kbd className="ml-1 hidden sm:inline-flex">{g.key}</Kbd>
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <Button className="w-full sm:w-auto" onClick={onReveal} size="lg">
            <HugeiconsIcon
              data-icon="inline-start"
              icon={ViewIcon}
              strokeWidth={2}
            />
            Show answer <Kbd className="hidden sm:inline-flex">Space</Kbd>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function EmptyReview({ reviewed }: { reviewed: number }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon
            icon={reviewed ? CheckmarkCircle02Icon : Cards01Icon}
            strokeWidth={2}
          />
        </EmptyMedia>
        <EmptyTitle>
          {reviewed ? "All done for now!" : "No cards due"}
        </EmptyTitle>
        <EmptyDescription>
          {reviewed
            ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. Come back tomorrow.`
            : "Open any lesson and press “Add to my flashcards” at the end."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<a href="/roadmap" />}
          variant="outline"
        >
          Go to the roadmap
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function DeckList() {
  const [rows, setRows] = useState<FlashcardRow[] | null>(null);

  useEffect(() => {
    const sub = liveQuery(() => db.cards.toArray()).subscribe({
      error: () => setRows([]),
      next: setRows,
    });
    return () => sub.unsubscribe();
  }, []);

  if (!rows?.length) {
    return null;
  }

  const decks = Object.values(
    rows.reduce<
      Record<
        string,
        {
          lessonId: string;
          title: string;
          level: string;
          count: number;
          due: number;
        }
      >
    >((acc, r) => {
      if (!Object.hasOwn(acc, r.lessonId)) {
        acc[r.lessonId] = {
          count: 0,
          due: 0,
          lessonId: r.lessonId,
          level: r.level,
          title: r.lessonTitle,
        };
      }
      const d = acc[r.lessonId];
      d.count += 1;
      if (r.due <= Date.now()) {
        d.due += 1;
      }
      return acc;
    }, {})
  ).sort((a, b) => a.lessonId.localeCompare(b.lessonId));

  return (
    <section aria-labelledby="decks-title" className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-bold" id="decks-title">
        Your decks
      </h2>
      <div className="bg-card rounded-2xl border">
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
                  <a
                    className="hover:underline"
                    href={`/lessons/${d.lessonId}`}
                  >
                    <Badge className="mr-2" variant="outline">
                      {d.level}
                    </Badge>
                    {d.title}
                  </a>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.due}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    aria-label={`Remove ${d.title} cards`}
                    onClick={() => removeLessonCards(d.lessonId)}
                    size="icon-sm"
                    variant="ghost"
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
  );
}
