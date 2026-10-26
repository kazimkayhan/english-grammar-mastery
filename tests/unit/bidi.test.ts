import { describe, expect, it } from "vitest"

import { isolateLatinHtml, isolateLatinText, isolatePersian, splitPersianRuns } from "@/lib/bidi"

describe("bidi isolation for English inside Persian", () => {
  it("wraps a whole English sentence including its final period", () => {
    expect(isolateLatinText("با I ← am: I am a student. (من دانشجو هستم.)")).toBe(
      'با <bdi dir="ltr" lang="en">I</bdi> ← <bdi dir="ltr" lang="en">am: I am a student.</bdi> (من دانشجو هستم.)',
    )
  })
  it("leaves tags untouched and isolates text inside them", () => {
    expect(isolateLatinHtml("<strong>am</strong> فعل")).toBe('<bdi dir="ltr" lang="en"><strong>am</strong></bdi> فعل')
    expect(isolateLatinHtml("<p><strong>اجزای کلام (parts of speech):</strong> هر</p>")).toBe(
      '<p><strong>اجزای کلام <bdi dir="ltr" lang="en">(parts of speech)</bdi>:</strong> هر</p>',
    )
  })
  it("keeps bold words inside an English phrase in the same run", () => {
    expect(isolateLatinHtml("«بین بانک <strong>و</strong> نانوایی» = between the bank <strong>and</strong> the bakery (نه with).")).toBe(
      '«بین بانک <strong>و</strong> نانوایی» = <bdi dir="ltr" lang="en">between the bank <strong>and</strong> the bakery</bdi> (نه <bdi dir="ltr" lang="en">with</bdi>).',
    )
    expect(isolateLatinHtml("«کنارِ» = next <strong>to</strong> (نه next of).")).toBe(
      '«کنارِ» = <bdi dir="ltr" lang="en">next <strong>to</strong></bdi> (نه <bdi dir="ltr" lang="en">next of</bdi>).',
    )
  })
  it("never lets a run break the nesting of tags", () => {
    expect(isolateLatinHtml("<strong>in</strong> Tehran")).toBe('<bdi dir="ltr" lang="en"><strong>in</strong> Tehran</bdi>')
    expect(isolateLatinHtml("go <strong>went فعل</strong>")).toBe(
      '<bdi dir="ltr" lang="en">go</bdi> <strong><bdi dir="ltr" lang="en">went</bdi> فعل</strong>',
    )
    expect(isolateLatinHtml("<p>tea.</p><p>Ali</p>")).toBe('<p><bdi dir="ltr" lang="en">tea</bdi>.</p><p><bdi dir="ltr" lang="en">Ali</bdi></p>')
  })
  it("keeps an ellipsis inside the English", () => {
    expect(isolateLatinText("between … and … = بین … و …")).toBe('<bdi dir="ltr" lang="en">between … and …</bdi> = بین … و …')
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
  it("keeps a bracketed English list together, with English commas", () => {
    expect(isolateLatinText("اسم (Ali، tea، love)")).toBe('اسم <bdi dir="ltr" lang="en">(Ali, tea, love)</bdi>')
    expect(isolateLatinText("اجزای کلام (parts of speech): هر کلمه")).toBe(
      'اجزای کلام <bdi dir="ltr" lang="en">(parts of speech)</bdi>: هر کلمه',
    )
    expect(isolateLatinText("فاعل (subject) + فعل (verb)")).toBe(
      'فاعل <bdi dir="ltr" lang="en">(subject)</bdi> + فعل <bdi dir="ltr" lang="en">(verb)</bdi>',
    )
  })
  it("leaves an unpaired bracket outside the English", () => {
    expect(isolateLatinText("(مثلاً go)")).toBe('(مثلاً <bdi dir="ltr" lang="en">go</bdi>)')
    expect(isolateLatinText("(go، مثلاً)")).toBe('(<bdi dir="ltr" lang="en">go</bdi>، مثلاً)')
  })
  it("keeps a full stop with an English sentence, otherwise leaves it to the Persian sentence", () => {
    expect(isolateLatinText("می‌آید: Ali drinks tea. ۲)")).toBe('می‌آید: <bdi dir="ltr" lang="en">Ali drinks tea.</bdi> ۲)')
    expect(isolateLatinText("قبل از اسم است: hot tea.")).toBe('قبل از اسم است: <bdi dir="ltr" lang="en">hot tea</bdi>.')
    expect(isolateLatinText("مفعول (object).")).toBe('مفعول <bdi dir="ltr" lang="en">(object)</bdi>.')
    expect(isolateLatinText("(✗ I have 25 years).")).toBe('(✗ <bdi dir="ltr" lang="en">I have 25 years</bdi>).')
    expect(isolateLatinText("قید be: She is never late.")).toBe('قید <bdi dir="ltr" lang="en">be: She is never late.</bdi>')
    expect(isolateLatinText("ساعت 9 a.m.")).toBe('ساعت 9 <bdi dir="ltr" lang="en">a.m.</bdi>')
  })
  it("splits a Persian list outside brackets into items", () => {
    expect(isolateLatinText("go ← went، see ← saw")).toBe(
      '<bdi dir="ltr" lang="en">go</bdi> ← <bdi dir="ltr" lang="en">went</bdi>، <bdi dir="ltr" lang="en">see</bdi> ← <bdi dir="ltr" lang="en">saw</bdi>',
    )
  })
  it("keeps apostrophes and numbers in the run", () => {
    expect(isolateLatinText("بگویید I'm 20.")).toBe('بگویید <bdi dir="ltr" lang="en">I\'m 20.</bdi>')
  })
})
