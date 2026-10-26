// Persian (right-to-left) text often contains English examples. Without isolation the browser's
// bidi algorithm moves their punctuation to the wrong side (".I am a student"). This wraps every
// run of Latin text in <bdi dir="ltr"> so each English fragment keeps its own order.
//
// HTML is flattened first: each inline tag (<strong>, <mark>…) becomes one placeholder that may sit
// inside a run, so "between the bank <strong>and</strong> the bakery" stays one run; any other tag
// ends a run. A run is wrapped whole only when it closes every tag it opens (the HTML stays well
// formed); otherwise each text segment between its tags is wrapped on its own.

const TAG = "\uE000" // an inline tag
const BREAK = "\uE001" // any other tag
const INLINE_TAG = /^<\/?(?:a|abbr|b|code|del|em|i|kbd|mark|s|small|span|strong|sub|sup|u)\b/i

// A candidate run may hold brackets, Persian commas and inline tags; wrapRun() then splits and trims it.
const LATIN_RUN = /\(?[A-Za-z][A-Za-z0-9'’\-/,.!?:()،… \uE000]*[A-Za-z0-9'’.!?)…\uE000]|\(?[A-Za-z]\)?/g

const RUN_END = /[A-Za-z0-9'’.!?)…]/

// English that is a sentence ("Ali drinks tea.", "be: She is never late.") keeps its full stop.
const SENTENCE = /^[A-Z]|[:.!?] [A-Z]/

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }

/** Decode the entities a renderer may emit, so "I&#39;m" is seen as one English word. */
const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : match
    }
    return NAMED[code.toLowerCase()] ?? match
  })

interface Flat {
  text: string
  tags: Map<number, string> // position of each placeholder → the tag it stands for
}

function flattenHtml(html: string): Flat {
  let text = ""
  const tags = new Map<number, string>()
  for (const part of html.split(/(<[^>]+>)/)) {
    if (part.startsWith("<")) {
      tags.set(text.length, part)
      text += INLINE_TAG.test(part) ? TAG : BREAK
    } else text += decodeEntities(part)
  }
  return { text, tags }
}

/** The HTML for text[from, to): placeholders turn back into their tags and text is escaped. */
function emit(f: Flat, from: number, to: number, english = false): string {
  let out = ""
  for (let i = from; i < to; i++) {
    const c = f.text[i]
    // Inside a bracketed English list the commas are English too: "(Ali، tea)" → "(Ali, tea)".
    out += f.tags.get(i) ?? escapeHtml(english && c === "،" ? "," : c)
  }
  return out
}

const tagName = (tag: string) => /^<\/?([a-z0-9]+)/i.exec(tag)?.[1].toLowerCase() ?? ""

/** Placeholders in [from, to) whose partner tag lies outside the range. */
function unpaired(f: Flat, from: number, to: number): number[] {
  const open: number[] = []
  const lone: number[] = []
  for (let i = from; i < to; i++) {
    if (f.text[i] !== TAG) continue
    const tag = f.tags.get(i)!
    if (!tag.startsWith("</")) {
      if (!tag.endsWith("/>")) open.push(i)
    } else if (open.length && tagName(f.tags.get(open.at(-1)!)!) === tagName(tag)) open.pop()
    else lone.push(i)
  }
  return [...lone, ...open]
}

const count = (s: string, c: string) => s.split(c).length - 1

/** One piece of English: brackets stay inside only when they pair up ("(Ali, tea)" but "go" + ")"). */
function wrapPiece(f: Flat, from: number, to: number): string {
  let start = from
  let end = to
  const inner = () => f.text.slice(start, end).replaceAll(TAG, "")
  // A final full stop belongs to English that is a sentence ("Ali drinks tea.") or an abbreviation
  // ("a.m."); any other ends the Persian sentence, so it goes outside: "… مفعول (object)."
  const whole = inner().trim()
  const ownsStop = (SENTENCE.test(whole) && !whole.endsWith(").")) || /\.[A-Za-z]+\.$/.test(whole)
  while (end > start && /\s/.test(f.text[end - 1])) end--
  if (f.text[end - 1] === "." && !ownsStop) end--
  for (;;) {
    if (start >= end) break
    const s = inner()
    const first = f.text[start]
    const last = f.text[end - 1]
    if (/\s/.test(first)) start++
    else if (/\s/.test(last)) end--
    else if (first === "(" && count(s, "(") > count(s, ")")) start++
    else if (last === ")" && count(s, ")") > count(s, "(")) end--
    else if (first === TAG && unpaired(f, start, end).includes(start)) start++
    else if (last === TAG && unpaired(f, start, end).includes(end - 1)) end--
    else if (last !== TAG && !RUN_END.test(last)) end-- // "(parts of speech):</strong>" ends at ")"
    else break
  }
  if (!/[A-Za-z]/.test(inner())) return emit(f, from, to)
  if (unpaired(f, start, end).length) {
    // A tag crosses the run: wrap each text segment between the tags on its own.
    let out = emit(f, from, start)
    let segment = start
    for (let i = start; i <= end; i++) {
      if (i < end && f.text[i] !== TAG) continue
      out += wrapPiece(f, segment, i) + emit(f, i, Math.min(i + 1, end))
      segment = i + 1
    }
    return out + emit(f, end, to)
  }
  return `${emit(f, from, start)}<bdi dir="ltr" lang="en">${emit(f, start, end, true)}</bdi>${emit(f, end, to)}`
}

/** A Persian comma outside brackets separates items of a Persian list ("go ← went، see ← saw"),
 *  so each item is isolated on its own and the list reads right to left. */
function wrapRun(f: Flat, from: number, to: number): string {
  let out = ""
  let depth = 0
  let piece = from
  for (let i = from; i < to; i++) {
    const c = f.text[i]
    if (c === "(") depth++
    else if (c === ")") depth = Math.max(0, depth - 1)
    else if (c === "،" && depth === 0) {
      out += wrapPiece(f, piece, i) + "،"
      piece = i + 1
    }
  }
  return out + wrapPiece(f, piece, to)
}

function isolate(f: Flat): string {
  let out = ""
  let last = 0
  for (const m of f.text.matchAll(LATIN_RUN)) {
    const end = m.index! + m[0].length
    // Take in an opening tag just before the run when the run holds its closing tag: "<strong>in</strong> Tehran".
    let start = m.index!
    while (start > last && f.text[start - 1] === TAG && unpaired(f, start - 1, end).length < unpaired(f, start, end).length) start--
    out += emit(f, last, start) + wrapRun(f, start, end)
    last = end
  }
  return out + emit(f, last, f.text.length)
}

/** Isolate Latin runs inside an HTML string (tags are kept, and stay well formed). */
export function isolateLatinHtml(html: string): string {
  return isolate(flattenHtml(html))
}

/** Same for plain text. */
export function isolateLatinText(text: string): string {
  return isolate({ text, tags: new Map() })
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
