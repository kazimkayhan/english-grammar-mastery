// Small text helpers. A grammar course must get its own grammar right.

/** "1 lesson", "2 lessons"; pass the plural for irregular nouns. */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** "is" / "are" agreeing with a count. */
export const isAre = (n: number) => (n === 1 ? "is" : "are")
