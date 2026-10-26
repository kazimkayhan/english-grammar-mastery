import { describe, expect, it } from "vitest"

import { parseOutline } from "@/lib/outline"

describe("parseOutline", () => {
  const md = `# be
## Forms
- I → am
- he / she / it → is
  - she's
## Uses
- age: **I'm 20**`

  it("builds the tree from headings and list items", () => {
    const root = parseOutline(md)
    expect(root.content).toBe("be")
    expect(root.children.map((c) => c.content)).toEqual(["Forms", "Uses"])
    expect(root.children[0].children.map((c) => c.content)).toEqual(["I → am", "he / she / it → is"])
    expect(root.children[0].children[1].children[0].content).toBe("she's")
  })

  it("renders inline bold and escapes HTML", () => {
    const root = parseOutline(md)
    expect(root.children[1].children[0].content).toBe("age: <strong>I'm 20</strong>")
    expect(parseOutline("# <script>").content).toBe("&lt;script&gt;")
  })

  it("supports ### sub-branches", () => {
    const root = parseOutline("# Root\n## A\n### A1\n- leaf\n## B")
    expect(root.children[0].children[0].children[0].content).toBe("leaf")
    expect(root.children[1].content).toBe("B")
  })

  it("uses the fallback title when there is no # heading", () => {
    expect(parseOutline("## Only branch", "Title").content).toBe("Title")
  })
})
