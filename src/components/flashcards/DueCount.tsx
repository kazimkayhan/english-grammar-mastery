import * as React from "react"
import { liveQuery } from "dexie"
import { useStore } from "@nanostores/react"

import { countDue } from "@/lib/srs"
import { $settings } from "@/stores/settings"

/** Live number of flashcards due today (respects the new-cards-per-day limit). */
export function useDueCount() {
  const { newCardsPerDay } = useStore($settings)
  const [count, setCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    const sub = liveQuery(() => countDue(newCardsPerDay)).subscribe({
      next: setCount,
      error: () => setCount(null),
    })
    return () => sub.unsubscribe()
  }, [newCardsPerDay])

  return count
}

export function DueCount() {
  const count = useDueCount()
  if (!count) return null
  return <span aria-label={`${count} ${count === 1 ? "flashcard" : "flashcards"} due`}>{count}</span>
}
