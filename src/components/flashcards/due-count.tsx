import { useStore } from "@nanostores/react";
import { liveQuery } from "dexie";
import { useEffect, useState } from "react";

import { countDue } from "@/lib/srs";
import { $settings } from "@/stores/settings";

/** Live number of flashcards due today (respects the new-cards-per-day limit). */
export function useDueCount() {
  const { newCardsPerDay } = useStore($settings);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sub = liveQuery(() => countDue(newCardsPerDay)).subscribe({
      error: () => setCount(null),
      next: setCount,
    });
    return () => sub.unsubscribe();
  }, [newCardsPerDay]);

  return count;
}

export function DueCount() {
  const count = useDueCount();
  if (!count) {
    return null;
  }
  return (
    <span
      aria-label={`${count} ${count === 1 ? "flashcard" : "flashcards"} due`}
      role="img"
    >
      {count}
    </span>
  );
}
