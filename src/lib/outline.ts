// Turns a mindmap outline into a node tree for markmap-view.
//   # Root
//   ## Branch
//   ### Sub-branch
//   - leaf
//     - deeper leaf (2-space indent)
// Inline: **bold**, *italic*, `code`. Everything else is plain text (HTML-escaped).

export interface OutlineNode {
  content: string
  children: OutlineNode[]
  payload?: Record<string, unknown>
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function inlineHtml(text: string): string {
  return escapeHtml(text.trim())
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
}

export function parseOutline(markdown: string, fallbackTitle = "Mindmap"): OutlineNode {
  const root: OutlineNode = { content: inlineHtml(fallbackTitle), children: [] }
  // stack[d] = last node at depth d (root = depth 1)
  const stack: OutlineNode[] = [root]
  let headingDepth = 1
  let sawRoot = false

  for (const raw of markdown.split(/\r?\n/)) {
    if (!raw.trim()) continue
    const heading = raw.match(/^(#{1,6})\s+(.*)$/)
    const item = raw.match(/^(\s*)[-*+]\s+(.*)$/)
    let depth: number
    let text: string

    if (heading) {
      depth = heading[1].length
      text = heading[2]
      if (depth === 1) {
        if (!sawRoot) {
          root.content = inlineHtml(text)
          sawRoot = true
          continue
        }
        depth = 2 // extra top-level headings become branches
      }
      headingDepth = depth
    } else if (item) {
      depth = headingDepth + 1 + Math.floor(item[1].replace(/\t/g, "  ").length / 2)
      text = item[2]
    } else {
      continue
    }

    const node: OutlineNode = { content: inlineHtml(text), children: [] }
    // Attach to the nearest shallower node.
    const parentDepth = Math.min(depth - 1, stack.length)
    const parent = stack[parentDepth - 1] ?? root
    parent.children.push(node)
    stack.length = parentDepth
    stack.push(node)
  }
  return root
}
