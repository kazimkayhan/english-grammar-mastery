import { createEmptyCard, Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";

import { scheduler } from "@/lib/srs";

describe("FSRS scheduling", () => {
  const now = new Date("2026-01-01T09:00:00Z");

  it("orders intervals Again < Hard < Good < Easy for a new card", () => {
    const preview = scheduler.repeat(createEmptyCard(now), now);
    type Grade =
      | typeof Rating.Again
      | typeof Rating.Hard
      | typeof Rating.Good
      | typeof Rating.Easy;
    const due = (r: Grade) => preview[r].card.due.getTime();
    expect(due(Rating.Again)).toBeLessThanOrEqual(due(Rating.Hard));
    expect(due(Rating.Hard)).toBeLessThanOrEqual(due(Rating.Good));
    expect(due(Rating.Good)).toBeLessThan(due(Rating.Easy));
  });

  it("pushes a well-known card further into the future", () => {
    let card = createEmptyCard(now);
    let t = now;
    const gaps: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const { card: next } = scheduler.next(card, t, Rating.Good);
      gaps.push(next.due.getTime() - t.getTime());
      t = next.due;
      card = next;
    }
    expect(gaps[3]).toBeGreaterThan(gaps[1]);
  });
});
