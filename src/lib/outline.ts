// Turns a mindmap outline into a node tree for markmap-view.
//   # Root
//   ## Branch
//   ### Sub-branch
//   - leaf
//     - deeper leaf (2-space indent)
// Inline: **bold**, *italic*, `code`. Everything else is plain text (HTML-escaped).

export interface OutlineNode {
  children: OutlineNode[];
  content: string;
  payload?: Record<string, unknown>;
}

const BOLD = /\*\*(?<bold>.+?)\*\*/gu;
const EMPHASIS = /\*(?<em>.+?)\*/gu;
const CODE_SPAN = /`(?<code>.+?)`/gu;
const LINE_BREAK = /\r?\n/u;
const TAB = /\t/gu;
const HEADING_LINE = /^(?<marks>#{1,6})\s+(?<title>.*)$/u;
const LIST_ITEM_LINE = /^(?<indent>\s*)[-*+]\s+(?<body>.*)$/u;

const escapeHtml = (s: string) =>
  s
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");

export function inlineHtml(text: string): string {
  return escapeHtml(text.trim())
    .replace(BOLD, "<strong>$<bold></strong>")
    .replace(EMPHASIS, "<em>$<em></em>")
    .replace(CODE_SPAN, "<code>$<code></code>");
}

export function parseOutline(
  markdown: string,
  fallbackTitle = "Mindmap"
): OutlineNode {
  const root: OutlineNode = {
    children: [],
    content: inlineHtml(fallbackTitle),
  };
  // stack[d] = last node at depth d (root = depth 1)
  const stack: OutlineNode[] = [root];
  let headingDepth = 1;
  let sawRoot = false;

  for (const raw of markdown.split(LINE_BREAK)) {
    if (!raw.trim()) {
      continue;
    }
    const heading = raw.match(HEADING_LINE);
    const item = raw.match(LIST_ITEM_LINE);
    let depth: number;
    let text: string;

    if (heading) {
      const [, marks, title] = heading;
      depth = marks.length;
      text = title;
      if (depth === 1) {
        if (!sawRoot) {
          root.content = inlineHtml(text);
          sawRoot = true;
          continue;
        }
        depth = 2; // extra top-level headings become branches
      }
      headingDepth = depth;
    } else if (item) {
      const [, indent, body] = item;
      depth =
        headingDepth + 1 + Math.floor(indent.replace(TAB, "  ").length / 2);
      text = body;
    } else {
      continue;
    }

    const node: OutlineNode = { children: [], content: inlineHtml(text) };
    // Attach to the nearest shallower node.
    const parentDepth = Math.min(depth - 1, stack.length);
    const parent = stack[parentDepth - 1] ?? root;
    parent.children.push(node);
    stack.length = parentDepth;
    stack.push(node);
  }
  return root;
}
