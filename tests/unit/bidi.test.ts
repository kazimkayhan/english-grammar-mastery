import { describe, expect, it } from "vitest"

import { isolateLatinHtml, isolateLatinText, isolatePersian, splitPersianRuns } from "@/lib/bidi"

describe("bidi isolation for English inside Persian", () => {
  it("wraps a whole English sentence including its final period", () => {
    expect(isolateLatinText("با I ← am: I am a student. (من دانشجو هستم.)")).toBe(
      'با <bdi dir="ltr" lang="en">I</bdi> ← <bdi dir="ltr" lang="en">am: I am a student.</bdi> (من دانشجو هستم.)',
    )
  })
  it("leaves tags untouched and isolates text inside them", () => {
    expect(isolateLatinHtml("<strong>am</strong> فعل")).toBe('<strong><bdi dir="ltr" lang="en">am</bdi></strong> فعل')
  })
  it("escapes HTML in plain text", () => {
    expect(isolateLatinText("<b>")).toBe('&lt;<bdi dir="ltr" lang="en">b</bdi>&gt;')
  })
  it("treats entities in rendered HTML as characters (I&#39;m stays one word)", () => {
    expect(isolateLatinHtml("<p>بگویید I&#39;m &amp; you</p>")).toBe(
      `<p>بگویید <bdi dir="ltr" lang="en">I'm</bdi> &amp; <bdi dir="ltr" lang="en">you</bdi></p>`,
    )
  })
  it("isolates Persian words inside English", () => {
    expect(isolatePersian("Every lesson has a full Persian explanation (توضیح کامل فارسی) you can open.")).toBe(
      'Every lesson has a full Persian explanation (<bdi dir="rtl" lang="fa" class="fa">توضیح کامل فارسی</bdi>) you can open.',
    )
    expect(splitPersianRuns("no Persian here")).toEqual([{ text: "no Persian here", fa: false }])
  })
  it("keeps apostrophes and numbers in the run", () => {
    expect(isolateLatinText("بگویید I'm 20.")).toBe('بگویید <bdi dir="ltr" lang="en">I\'m 20.</bdi>')
  })
})
