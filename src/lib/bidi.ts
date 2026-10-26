// Persian (right-to-left) text often contains English examples. Without isolation the browser's
// bidi algorithm moves their punctuation to the wrong side (".I am a student"). This wraps every
// run of Latin text in <bdi dir="ltr"> so each English fragment keeps its own order.

const LATIN_RUN = /[A-Za-z][A-Za-z0-9'’\-/,.!?: ]*[A-Za-z0-9'’.!?)]|[A-Za-z]/g

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }

/** Decode the entities a renderer may emit, so "I&#39;m" is seen as one English word. */
const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : match
    }
    return NAMED[code.toLowerCase()] ?? match
  })

function isolateText(text: string): string {
  let out = ""
  let last = 0
  for (const m of text.matchAll(LATIN_RUN)) {
    out += escapeHtml(text.slice(last, m.index)) + `<bdi dir="ltr" lang="en">${escapeHtml(m[0])}</bdi>`
    last = m.index! + m[0].length
  }
  return out + escapeHtml(text.slice(last))
}

/** Isolate Latin runs inside an HTML string (tags are left untouched). */
export function isolateLatinHtml(html: string): string {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith("<") ? part : isolateText(decodeEntities(part))))
    .join("")
}

/** Same for plain text. */
export function isolateLatinText(text: string): string {
  return isolateText(text)
}

// The reverse case: Persian words inside an English sentence ("(توضیح کامل فارسی)").
const PERSIAN_RUN = /[؀-ۿﭐ-﷿ﹰ-﻿][؀-ۿﭐ-﷿ﹰ-﻿‌۰-۹ «»،؛]*/g

/** Split plain text into English and Persian pieces, so Persian runs can be wrapped in <bdi dir="rtl">. */
export function splitPersianRuns(text: string): { text: string; fa: boolean }[] {
  const parts: { text: string; fa: boolean }[] = []
  let last = 0
  for (const m of text.matchAll(PERSIAN_RUN)) {
    const run = m[0].trimEnd()
    if (m.index! > last) parts.push({ text: text.slice(last, m.index), fa: false })
    parts.push({ text: run, fa: true })
    last = m.index! + run.length
  }
  if (last < text.length) parts.push({ text: text.slice(last), fa: false })
  return parts
}

/** HTML version: escape, then isolate Persian runs inside English text. */
export function isolatePersian(text: string): string {
  return splitPersianRuns(text)
    // Short phrases stay on one line: a Persian phrase split across lines inside English reads badly.
    .map((p) =>
      p.fa
        ? `<bdi dir="rtl" lang="fa" class="fa">${escapeHtml(p.text.length <= 30 ? p.text.replace(/ /g, " ") : p.text)}</bdi>`
        : escapeHtml(p.text),
    )
    .join("")
}
