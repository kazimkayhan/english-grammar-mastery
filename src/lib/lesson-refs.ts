// Lesson cross-references such as "lesson 21", "A2 lesson 7 (Past simple: more irregular verbs)"
// or "lessons 5, 6 and 25". They are shown smaller and in the sans font (see .lesson-ref in global.css).
const LESSON_REF =
  /(?:\b[ABC][12],? )?\b[Ll]essons? \d+(?:[ \t]\([^()\n]*\)|,[ \t](?:\*[^*\n]+\*|“[^”\n]+”|[A-Z][^,.()\n*<“]*(?=\))))?/g

export interface RefPart {
  text: string
  ref: boolean
}

/** Splits plain text into runs, marking the lesson references. */
export function splitLessonRefs(text: string): RefPart[] {
  const parts: RefPart[] = []
  let last = 0
  for (const match of text.matchAll(LESSON_REF)) {
    const start = match.index
    if (start > last) parts.push({ text: text.slice(last, start), ref: false })
    parts.push({ text: match[0], ref: true })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), ref: false })
  return parts
}

/** Wraps lesson references in an HTML string. Tags are left as they are. */
export function markLessonRefs(html: string): string {
  return html
    .split(/(<[^>]+>)/)
    .map((piece) =>
      piece.startsWith("<")
        ? piece
        : splitLessonRefs(piece)
            .map((part) => (part.ref ? `<span class="lesson-ref">${part.text}</span>` : part.text))
            .join(""),
    )
    .join("")
}
