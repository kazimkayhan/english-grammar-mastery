import {
  BookmarkAdd01Icon,
  BookmarkCheck01Icon,
  Cards01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { liveQuery } from "dexie";
import { useEffect, useState } from "react";

import { MixedText } from "@/components/common/mixed-text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { db } from "@/lib/db";
import { addLessonCards, type LessonCards, removeLessonCards } from "@/lib/srs";
import { plural } from "@/lib/text";

export function AddToFlashcards(props: LessonCards) {
  const [inDeck, setInDeck] = useState<number | null>(null);

  useEffect(() => {
    const sub = liveQuery(() =>
      db.cards.where("lessonId").equals(props.lessonId).count()
    ).subscribe({
      error: () => setInDeck(0),
      next: setInDeck,
    });
    return () => sub.unsubscribe();
  }, [props.lessonId]);

  const add = async () => {
    const added = await addLessonCards(props);
    toast.add({
      description: "They'll come back just before you would forget them.",
      title: added
        ? `${plural(added, "flashcard")} added`
        : "Already in your flashcards",
      type: "success",
    });
  };

  const all = inDeck === props.cards.length;

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} />
          Keep it: flashcards
        </CardTitle>
        <CardDescription>
          {plural(props.cards.length, "card")} from this lesson. Review them for
          10 minutes a day; spaced repetition brings each card back right before
          you'd forget it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {props.cards.map((c) => (
            <li
              className="bg-muted/40 rounded-xl border px-3 py-2 text-sm"
              key={c.front}
            >
              <span className="font-bold">
                <MixedText text={c.front} />
              </span>
              <span className="text-muted-foreground block">
                <MixedText text={c.back} />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {all ? (
          <>
            <Button disabled variant="secondary">
              <HugeiconsIcon
                data-icon="inline-start"
                icon={BookmarkCheck01Icon}
                strokeWidth={2}
              />
              In your flashcards
            </Button>
            <Button
              onClick={() => removeLessonCards(props.lessonId)}
              variant="ghost"
            >
              Remove
            </Button>
            <Button
              nativeButton={false}
              render={<a href="/flashcards" />}
              variant="link"
            >
              Review now
            </Button>
          </>
        ) : (
          <Button disabled={inDeck === null} onClick={add}>
            <HugeiconsIcon
              data-icon="inline-start"
              icon={BookmarkAdd01Icon}
              strokeWidth={2}
            />
            {inDeck ? "Add the missing cards" : "Add to my flashcards"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
