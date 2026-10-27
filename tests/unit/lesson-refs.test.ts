import { describe, expect, it } from "vitest"

import { markLessonRefs, splitLessonRefs } from "@/lib/lesson-refs"

describe("splitLessonRefs", () => {
  it("marks a plain reference", () => {
    expect(splitLessonRefs("That is lesson 4.")).toEqual([
      { text: "That is ", ref: false },
      { text: "lesson 4", ref: true },
      { text: ".", ref: false },
    ])
  })

  it("keeps the level and the title together", () => {
    expect(splitLessonRefs("See A2 lesson 7 (Past simple: more irregular verbs).")).toEqual([
      { text: "See ", ref: false },
      { text: "A2 lesson 7 (Past simple: more irregular verbs)", ref: true },
      { text: ".", ref: false },
    ])
  })

  it("keeps a plain title inside the brackets", () => {
    expect(splitLessonRefs("(lesson 17, Present simple: positive).")).toEqual([
      { text: "(", ref: false },
      { text: "lesson 17, Present simple: positive", ref: true },
      { text: ").", ref: false },
    ])
  })
})

describe("markLessonRefs", () => {
  it("wraps references and leaves tags alone", () => {
    expect(markLessonRefs("<b>I wasn't</b> · <b>Were you</b>…? (lesson 25).")).toBe(
      '<b>I wasn\'t</b> · <b>Were you</b>…? (<span class="lesson-ref">lesson 25</span>).',
    )
  })
})
