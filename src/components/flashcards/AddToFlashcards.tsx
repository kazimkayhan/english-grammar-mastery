import * as React from "react"
import { liveQuery } from "dexie"
import { HugeiconsIcon } from "@hugeicons/react"
import { BookmarkAdd01Icon, BookmarkCheck01Icon, Cards01Icon } from "@hugeicons/core-free-icons"

import { MixedText } from "@/components/common/MixedText"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { db } from "@/lib/db"
import { addLessonCards, removeLessonCards, type LessonCards } from "@/lib/srs"
import { plural } from "@/lib/text"

export function AddToFlashcards(props: LessonCards) {
  const [inDeck, setInDeck] = React.useState<number | null>(null)

  React.useEffect(() => {
    const sub = liveQuery(() => db.cards.where("lessonId").equals(props.lessonId).count()).subscribe({
      next: setInDeck,
      error: () => setInDeck(0),
    })
    return () => sub.unsubscribe()
  }, [props.lessonId])

  const add = async () => {
    const added = await addLessonCards(props)
    toast.add({
      title: added ? `${plural(added, "flashcard")} added` : "Already in your flashcards",
      description: "They'll come back just before you would forget them.",
      type: "success",
    })
  }

  const all = inDeck === props.cards.length

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} />
          Keep it: flashcards
        </CardTitle>
        <CardDescription>
          {plural(props.cards.length, "card")} from this lesson. Review them for 10 minutes a day; spaced repetition brings each card
          back right before you'd forget it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {props.cards.map((c, i) => (
            <li key={i} className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-bold">
                <MixedText text={c.front} />
              </span>
              <span className="block text-muted-foreground">
                <MixedText text={c.back} />
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {all ? (
          <>
            <Button variant="secondary" disabled>
              <HugeiconsIcon icon={BookmarkCheck01Icon} strokeWidth={2} data-icon="inline-start" />
              In your flashcards
            </Button>
            <Button variant="ghost" onClick={() => removeLessonCards(props.lessonId)}>
              Remove
            </Button>
            <Button variant="link" render={<a href="/flashcards" />} nativeButton={false}>
              Review now
            </Button>
          </>
        ) : (
          <Button onClick={add} disabled={inDeck === null}>
            <HugeiconsIcon icon={BookmarkAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            {inDeck ? "Add the missing cards" : "Add to my flashcards"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default AddToFlashcards
