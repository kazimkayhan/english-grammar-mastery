import Dexie, { type EntityTable } from "dexie";
import type { Card } from "ts-fsrs";

// Flashcards are the only learning data the app stores (no history, no stats).

export interface FlashcardRow {
  addedAt: number;
  back: string;
  /** FSRS scheduling state; `due` is indexed for the review queue. */
  card: Card;
  due: number;
  front: string;
  /** `${lessonId}#${index}` */
  id: string;
  lessonId: string;
  lessonTitle: string;
  level: string;
  pillar: string;
}

export const db = new Dexie("english-grammar-mastery") as Dexie & {
  cards: EntityTable<FlashcardRow, "id">;
};

db.version(1).stores({
  cards: "id, lessonId, due, level, pillar, addedAt",
});
