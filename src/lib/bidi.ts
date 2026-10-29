// Persian (right-to-left) text often contains English examples. Without isolation the browser's
// bidi algorithm moves their punctuation to the wrong side (".I am a student"). This wraps every
// run of Latin text in <bdi dir="ltr"> so each English fragment keeps its own order.
//
// HTML is flattened first: each inline tag (<strong>, <mark>…) becomes one placeholder that may sit
// inside a run, so "between the bank <strong>and</strong> the bakery" stays one run; any other tag
// ends a run. A run is wrapped whole only when it closes every tag it opens (the HTML stays well
// formed); otherwise each text segment between its tags is wrapped on its own.

const TAG = ""; // an inline tag
const BREAK = ""; // any other tag
const INLINE_TAG =
  /^<\/?(?:a|abbr|b|code|del|em|i|kbd|mark|s|small|span|strong|sub|sup|u)\b/iu;
const TAG_SPLIT = /(?<tag><[^>]+>)/u;
const TAG_NAME = /^<\/?(?<name>[a-z0-9]+)/iu;
const ENTITY = /&(?<code>#x[0-9a-f]+|#\d+|[a-z]+);/giu;
const WHITESPACE = /\s/u;
const LATIN_LETTER = /[A-Za-z]/u;
const ABBREVIATION_END = /\.[A-Za-z]+\.$/u;

// A candidate run may hold brackets, Persian commas and inline tags; wrapRun() then splits and trims it.
const LATIN_RUN =
  /\(?[A-Za-z][A-Za-z0-9'’\-/,.!?:()،… ]*[A-Za-z0-9'’.!?)…]|\(?[A-Za-z]\)?/gu;

const RUN_END = /[A-Za-z0-9'’.!?)…]/u;

// English that is a sentence ("Ali drinks tea.", "be: She is never late.") keeps its full stop.
const SENTENCE = /^[A-Z]|[:.!?] [A-Z]/u;

const escapeHtml = (s: string) =>
  s
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");

const NAMED: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

/** Decode the entities a renderer may emit, so "I&#39;m" is seen as one English word. */
const decodeEntities = (s: string) =>
  s.replace(ENTITY, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED[code.toLowerCase()] ?? match;
  });

interface Flat {
  tags: Map<number, string>; // position of each placeholder → the tag it stands for
  text: string;
}

function flattenHtml(html: string): Flat {
  let text = "";
  const tags = new Map<number, string>();
  for (const part of html.split(TAG_SPLIT)) {
    if (part.startsWith("<")) {
      tags.set(text.length, part);
      text += INLINE_TAG.test(part) ? TAG : BREAK;
    } else {
      text += decodeEntities(part);
    }
  }
  return { tags, text };
}

/** The HTML for text[from, to): placeholders turn back into their tags and text is escaped. */
function emit(f: Flat, from: number, to: number, english = false): string {
  let out = "";
  for (let i = from; i < to; i += 1) {
    const c = f.text[i];
    // Inside a bracketed English list the commas are English too: "(Ali، tea)" → "(Ali, tea)".
    out += f.tags.get(i) ?? escapeHtml(english && c === "،" ? "," : c);
  }
  return out;
}

const tagName = (tag: string) =>
  TAG_NAME.exec(tag)?.groups?.name?.toLowerCase() ?? "";

/** Placeholders in [from, to) whose partner tag lies outside the range. */
function unpaired(f: Flat, from: number, to: number): number[] {
  const open: { index: number; name: string }[] = [];
  const lone: number[] = [];
  for (let i = from; i < to; i += 1) {
    if (f.text[i] !== TAG) {
      continue;
    }
    const tag = f.tags.get(i) ?? "";
    if (tag.startsWith("</")) {
      const last = open.at(-1);
      if (last && last.name === tagName(tag)) {
        open.pop();
      } else {
        lone.push(i);
      }
    } else if (!tag.endsWith("/>")) {
      open.push({ index: i, name: tagName(tag) });
    }
  }
  return [...lone, ...open.map((o) => o.index)];
}

const count = (s: string, c: string) => s.split(c).length - 1;

const innerText = (f: Flat, start: number, end: number) =>
  f.text.slice(start, end).replaceAll(TAG, "");

/** One trim from either edge of [start, end), or null when that edge is settled. */
function trimStep(
  f: Flat,
  start: number,
  end: number
): [number, number] | null {
  const s = innerText(f, start, end);
  const first = f.text[start];
  const last = f.text[end - 1];
  if (WHITESPACE.test(first)) {
    return [start + 1, end];
  }
  if (WHITESPACE.test(last)) {
    return [start, end - 1];
  }
  if (first === "(" && count(s, "(") > count(s, ")")) {
    return [start + 1, end];
  }
  if (last === ")" && count(s, ")") > count(s, "(")) {
    return [start, end - 1];
  }
  if (first === TAG && unpaired(f, start, end).includes(start)) {
    return [start + 1, end];
  }
  if (last === TAG && unpaired(f, start, end).includes(end - 1)) {
    return [start, end - 1];
  }
  // "(parts of speech):</strong>" ends at ")"
  if (last !== TAG && !RUN_END.test(last)) {
    return [start, end - 1];
  }
  return null;
}

/** Narrow [from, to) past whitespace, unpaired brackets and tags, and punctuation that ends the run. */
function trimEdges(f: Flat, from: number, to: number): [number, number] {
  let start = from;
  let end = to;
  while (start < end) {
    const next = trimStep(f, start, end);
    if (!next) {
      break;
    }
    [start, end] = next;
  }
  return [start, end];
}

/** One piece of English: brackets stay inside only when they pair up ("(Ali, tea)" but "go" + ")"). */
function wrapPiece(f: Flat, from: number, to: number): string {
  // A final full stop belongs to English that is a sentence ("Ali drinks tea.") or an abbreviation
  // ("a.m."); any other ends the Persian sentence, so it goes outside: "… مفعول (object)."
  const whole = innerText(f, from, to).trim();
  const ownsStop =
    (SENTENCE.test(whole) && !whole.endsWith(").")) ||
    ABBREVIATION_END.test(whole);
  let trimmedEnd = to;
  while (trimmedEnd > from && WHITESPACE.test(f.text[trimmedEnd - 1])) {
    trimmedEnd -= 1;
  }
  if (f.text[trimmedEnd - 1] === "." && !ownsStop) {
    trimmedEnd -= 1;
  }
  const [start, end] = trimEdges(f, from, trimmedEnd);
  if (!LATIN_LETTER.test(innerText(f, start, end))) {
    return emit(f, from, to);
  }
  if (unpaired(f, start, end).length) {
    // A tag crosses the run: wrap each text segment between the tags on its own.
    let out = emit(f, from, start);
    let segment = start;
    for (let i = start; i <= end; i += 1) {
      if (i < end && f.text[i] !== TAG) {
        continue;
      }
      out += wrapPiece(f, segment, i) + emit(f, i, Math.min(i + 1, end));
      segment = i + 1;
    }
    return out + emit(f, end, to);
  }
  return `${emit(f, from, start)}<bdi dir="ltr" lang="en">${emit(f, start, end, true)}</bdi>${emit(f, end, to)}`;
}

/** A Persian comma outside brackets separates items of a Persian list ("go ← went، see ← saw"),
 *  so each item is isolated on its own and the list reads right to left. */
function wrapRun(f: Flat, from: number, to: number): string {
  let out = "";
  let depth = 0;
  let piece = from;
  for (let i = from; i < to; i += 1) {
    const c = f.text[i];
    if (c === "(") {
      depth += 1;
    } else if (c === ")") {
      depth = Math.max(0, depth - 1);
    } else if (c === "،" && depth === 0) {
      out += `${wrapPiece(f, piece, i)}،`;
      piece = i + 1;
    }
  }
  return out + wrapPiece(f, piece, to);
}

function isolate(f: Flat): string {
  let out = "";
  let last = 0;
  for (const m of f.text.matchAll(LATIN_RUN)) {
    const end = m.index + m[0].length;
    // Take in an opening tag just before the run when the run holds its closing tag: "<strong>in</strong> Tehran".
    let start = m.index;
    while (
      start > last &&
      f.text[start - 1] === TAG &&
      unpaired(f, start - 1, end).length < unpaired(f, start, end).length
    ) {
      start -= 1;
    }
    out += emit(f, last, start) + wrapRun(f, start, end);
    last = end;
  }
  return out + emit(f, last, f.text.length);
}

/** Isolate Latin runs inside an HTML string (tags are kept, and stay well formed). */
export function isolateLatinHtml(html: string): string {
  return isolate(flattenHtml(html));
}

/** Same for plain text. */
export function isolateLatinText(text: string): string {
  return isolate({ tags: new Map(), text });
}

// The reverse case: Persian words inside an English sentence ("(توضیح کامل فارسی)").
const PERSIAN_RUN = /[؀-ۿﭐ-﷿ﹰ-﻿][؀-ۿﭐ-﷿ﹰ-﻿‌۰-۹ «»،؛]*/gu;

/** Split plain text into English and Persian pieces, so Persian runs can be wrapped in <bdi dir="rtl">. */
export function splitPersianRuns(
  text: string
): { text: string; fa: boolean }[] {
  const parts: { text: string; fa: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(PERSIAN_RUN)) {
    const run = m[0].trimEnd();
    const matchStart = m.index;
    if (matchStart > last) {
      parts.push({ fa: false, text: text.slice(last, matchStart) });
    }
    parts.push({ fa: true, text: run });
    last = matchStart + run.length;
  }
  if (last < text.length) {
    parts.push({ fa: false, text: text.slice(last) });
  }
  return parts;
}

/** HTML version: escape, then isolate Persian runs inside English text. */
export function isolatePersian(text: string): string {
  return (
    splitPersianRuns(text)
      // Short phrases stay on one line: a Persian phrase split across lines inside English reads badly.
      .map((p) =>
        p.fa
          ? `<bdi dir="rtl" lang="fa" class="fa">${escapeHtml(p.text.length <= 30 ? p.text.replace(/ /gu, " ") : p.text)}</bdi>`
          : escapeHtml(p.text)
      )
      .join("")
  );
}
