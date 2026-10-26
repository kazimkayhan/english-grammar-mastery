import { describe, expect, it } from "vitest"

import {
  checkGap,
  checkMatch,
  checkReorder,
  expandContractions,
  matchesAny,
  modelAnswer,
  normalize,
  reorderAnswer,
  seededShuffle,
} from "@/lib/exercises"

describe("normalize", () => {
  it("ignores case, extra spaces, curly quotes and a final full stop", () => {
    expect(normalize("  She’s   HERE. ")).toBe("she's here")
  })
  it("keeps internal punctuation", () => {
    expect(normalize("Yes, I do.")).toBe("yes, i do")
  })
  it("keeps case and final punctuation in strict mode", () => {
    expect(normalize("Are you ready?", { strict: true })).toBe("Are you ready?")
  })
})

describe("matchesAny", () => {
  it("accepts contractions and full forms both ways", () => {
    expect(matchesAny("I'm not tired", ["I am not tired."])).toBe(true)
    expect(matchesAny("They are not here", ["They aren't here."])).toBe(true)
    expect(matchesAny("I won't go", ["I will not go"])).toBe(true)
  })
  it("rejects a wrong answer", () => {
    expect(matchesAny("She are my sister.", ["She is my sister."])).toBe(false)
  })
  it("rejects empty input", () => {
    expect(matchesAny("   ", ["is"])).toBe(false)
  })
  it("is strict about capitals when asked", () => {
    expect(matchesAny("i live in tehran.", ["I live in Tehran."], { strict: true })).toBe(false)
    expect(matchesAny("I live in Tehran.", ["I live in Tehran."], { strict: true })).toBe(true)
  })
})

describe("checkGap", () => {
  const prompt = "The coffee ___ very hot."
  it("accepts the missing word", () => {
    expect(checkGap("is", prompt, ["is", "'s"])).toBe(true)
  })
  it("accepts the whole sentence", () => {
    expect(checkGap("The coffee is very hot", prompt, ["is"])).toBe(true)
  })
  it("rejects the wrong word", () => {
    expect(checkGap("are", prompt, ["is"])).toBe(false)
  })
})

describe("reorder", () => {
  const chunks = ["We", "aren't", "late", "today."]
  it("joins chunks without a space before punctuation", () => {
    expect(reorderAnswer(["Hello", ",", "Sara", "."])).toBe("Hello, Sara.")
  })
  it("checks the order", () => {
    expect(checkReorder(chunks, chunks)).toBe(true)
    expect(checkReorder(["Aren't", "we", "late", "today."], chunks)).toBe(false)
  })
  it("accepts listed alternatives", () => {
    expect(checkReorder(["today", "we", "aren't", "late."], chunks, ["Today we aren't late."])).toBe(true)
  })
})

describe("match", () => {
  it("needs every pair right", () => {
    const pairs: [string, string][] = [
      ["I am", "I'm"],
      ["it is", "it's"],
    ]
    expect(checkMatch({ "I am": "I'm", "it is": "it's" }, pairs)).toBe(true)
    expect(checkMatch({ "I am": "it's", "it is": "I'm" }, pairs)).toBe(false)
  })
})

describe("seededShuffle", () => {
  it("is deterministic and never returns the original order", () => {
    const items = ["a", "b", "c", "d"]
    expect(seededShuffle(items, "x")).toEqual(seededShuffle(items, "x"))
    expect(seededShuffle(items, "x")).not.toEqual(items)
    expect([...seededShuffle(items, "x")].sort()).toEqual(items)
  })
})

describe("modelAnswer", () => {
  it("fills the gap with the first answer", () => {
    expect(modelAnswer({ type: "gap", prompt: "I ___ hungry.", answers: ["am"], explain: "" })).toBe("I am hungry.")
  })
})

describe("expandContractions", () => {
  it("keeps the capital I", () => {
    expect(expandContractions("I'm here")).toBe("I am here")
  })
})
