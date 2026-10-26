// Answer checking for every exercise type. Pure functions: easy to unit-test.

export type Exercise =
  | { type: "mcq"; prompt: string; options: string[]; answer: number; explain: string }
  | { type: "gap"; prompt: string; base?: string; answers: string[]; strict?: boolean; explain: string }
  | { type: "correct"; prompt: string; answers: string[]; strict?: boolean; explain: string }
  | { type: "reorder"; chunks: string[]; alternatives?: string[]; explain: string }
  | { type: "transform"; prompt: string; keyword?: string; start?: string; answers: string[]; explain: string }
  | { type: "match"; prompt: string; pairs: [string, string][]; explain: string }

export interface CheckOptions {
  /** Capitals and final punctuation count (punctuation and capital-letter lessons). */
  strict?: boolean
}

/**
 * Normalise for comparison: case, curly quotes, extra spaces and a final full stop
 * don't count. Punctuation inside the sentence still counts (it can be the point).
 * In strict mode, capitals and final punctuation count too.
 */
export function normalize(text: string, { strict = false }: CheckOptions = {}): string {
  let t = text
    .normalize("NFKC")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
  t = t.replace(/\s+([,.;:!?])/g, "$1")
  if (strict) return t
  return t.toLowerCase().replace(/[.!]+$/, "").trim()
}

/** Contractions and full forms are both accepted (I'm = I am, don't = do not…). */
const CONTRACTIONS: [RegExp, string][] = [
  [/\b(w)on't\b/gi, "$1ill not"],
  [/\b(c)an't\b/gi, "$1annot"],
  [/\b(s)han't\b/gi, "$1hall not"],
  [/n't\b/gi, " not"],
  [/\b(i)'m\b/gi, "$1 am"],
  [/'re\b/gi, " are"],
  [/'ve\b/gi, " have"],
  [/'ll\b/gi, " will"],
  [/\b(he|she|it|that|there|what|who|where|here)'s\b/gi, "$1 is"],
  [/\b(c)an not\b/gi, "$1annot"],
]

export function expandContractions(text: string): string {
  return CONTRACTIONS.reduce((t, [re, full]) => t.replace(re, full), text)
}

function variants(text: string, opts?: CheckOptions) {
  const n = normalize(text, opts)
  return new Set([n, expandContractions(n)])
}

export function matchesAny(input: string, accepted: string[], opts?: CheckOptions): boolean {
  if (!input.trim()) return false
  const given = variants(input, opts)
  return accepted.some((a) => [...variants(a, opts)].some((v) => given.has(v)))
}

/** For a gap prompt "She ___ to work.", accept either the missing word(s) or the whole sentence. */
export function checkGap(input: string, prompt: string, answers: string[], opts?: CheckOptions): boolean {
  if (matchesAny(input, answers, opts)) return true
  const full = answers.map((a) => prompt.replace("___", a))
  return matchesAny(input, full, opts)
}

export function reorderAnswer(chunks: string[]): string {
  return chunks.join(" ").replace(/\s+([,.;:!?])/g, "$1")
}

export function checkReorder(order: string[], chunks: string[], alternatives: string[] = []): boolean {
  return matchesAny(reorderAnswer(order), [reorderAnswer(chunks), ...alternatives])
}

export function checkMatch(chosen: Record<string, string>, pairs: [string, string][]): boolean {
  return pairs.every(([left, right]) => chosen[left] === right)
}

/** Deterministic shuffle (so server and client render the same order). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)
    const j = (h >>> 0) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  // Never show the chunks already in the right order.
  if (out.length > 1 && out.every((v, i) => v === items[i])) out.push(out.shift()!)
  return out
}

/** The canonical answer to show after a wrong attempt. */
export function modelAnswer(ex: Exercise): string {
  switch (ex.type) {
    case "mcq":
      return ex.options[ex.answer]
    case "gap":
      return ex.prompt.replace("___", ex.answers[0])
    case "correct":
    case "transform":
      return ex.answers[0]
    case "reorder":
      return reorderAnswer(ex.chunks)
    case "match":
      return ex.pairs.map(([l, r]) => `${l} → ${r}`).join(" · ")
  }
}
