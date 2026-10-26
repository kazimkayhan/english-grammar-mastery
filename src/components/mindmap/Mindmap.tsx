import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowExpand01Icon,
  ArrowShrink01Icon,
  Download01Icon,
  FitToScreenIcon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { parseOutline } from "@/lib/outline"
import { cn } from "@/lib/utils"

type Markmap = import("markmap-view").Markmap
type Root = Parameters<Markmap["setData"]>[0]
type MapNode = NonNullable<Root> & {
  payload?: { fold?: number; branch?: number }
  children?: MapNode[]
}

interface MindmapProps {
  /** Outline markdown: "# Root", "## Branch", "- leaf". */
  markdown: string
  /** "lesson": one colour (colorVar) for the whole map; "branches": one colour per first-level branch. */
  colors?: "lesson" | "families" | "branches"
  /** CSS colour variable for colors="lesson", e.g. "--fam-verbs". */
  colorVar?: string
  /** CSS colour variables for each first-level branch, in order (colors="branches"). */
  branchColors?: string[]
  height?: number
  /** Start folded so the learner recalls before revealing. */
  recallDefault?: boolean
  title?: string
  className?: string
}

const FAMILY_VARS = ["--fam-words", "--fam-verbs", "--fam-sentences", "--fam-text"]
const BRANCH_VARS = ["--fam-verbs", "--fam-sentences", "--fam-words", "--fam-text", "--persian", "--primary"]

/** An icon button with a visible name on hover and focus, so its purpose is clear before clicking. */
function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="outline" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "currentColor"
}

function setFold(node: MapNode, fold: (depth: number) => boolean, depth = 1) {
  node.payload = { ...node.payload, fold: node.children?.length && fold(depth) ? 1 : 0 }
  node.children?.forEach((c) => setFold(c, fold, depth + 1))
}

/** Tag every node with the index of its first-level branch (root = -1) for colouring. */
function tagBranches(root: MapNode) {
  root.payload = { ...root.payload, branch: -1 }
  const walk = (node: MapNode, branch: number) => {
    node.payload = { ...node.payload, branch }
    node.children?.forEach((c) => walk(c, branch))
  }
  root.children?.forEach((c, i) => walk(c, i))
}

export function Mindmap({
  markdown,
  colors = "branches",
  colorVar = "--primary",
  branchColors,
  height = 380,
  recallDefault = false,
  title = "Mindmap",
  className,
}: MindmapProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const mmRef = React.useRef<Markmap | null>(null)
  const [recall, setRecall] = React.useState(recallDefault)
  const [ready, setReady] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)

  const colorFn = React.useCallback(
    (node: MapNode) => {
      const branch = node.payload?.branch ?? -1
      if (branch < 0) return cssVar("--muted-foreground")
      if (colors === "lesson") return cssVar(colorVar)
      const vars = branchColors ?? (colors === "families" ? FAMILY_VARS : BRANCH_VARS)
      return cssVar(vars[branch % vars.length])
    },
    [colors, colorVar, branchColors],
  )

  const render = React.useCallback(
    async (foldMode: "recall" | "none") => {
      if (!svgRef.current) return
      const { Markmap } = await import("markmap-view")
      const data = parseOutline(markdown, title) as MapNode
      tagBranches(data)
      setFold(data, foldMode === "recall" ? (d) => d >= 2 : () => false)
      mmRef.current?.destroy()
      svgRef.current.innerHTML = ""
      // On a phone the map is limited by width, so narrower labels and gaps keep the text readable.
      const narrow = matchMedia("(max-width: 639px)").matches
      mmRef.current = Markmap.create(
        svgRef.current,
        {
          autoFit: true,
          duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300,
          initialExpandLevel: -1,
          maxWidth: narrow ? 150 : 260,
          fitRatio: 0.9,
          paddingX: 12,
          spacingVertical: 10,
          spacingHorizontal: narrow ? 40 : 90,
          color: colorFn as never,
          zoom: true,
          pan: true,
          scrollForPan: false,
        },
        data as Root,
      )
      setReady(true)
    },
    [markdown, title, colorFn],
  )

  // On small screens a fully open map is too tiny to read: start folded (recall first anyway).
  React.useEffect(() => {
    if (!recallDefault && window.matchMedia("(max-width: 639px)").matches) setRecall(true)
  }, [recallDefault])

  React.useEffect(() => {
    render(recall ? "recall" : "none")
    // Re-colour when the reading theme changes.
    const observer = new MutationObserver(() => render(recall ? "recall" : "none"))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => {
      observer.disconnect()
      mmRef.current?.destroy()
      mmRef.current = null
    }
  }, [render, recall])

  // Track full screen (the Escape key also leaves it), and refit the map once its new size is laid out.
  React.useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  React.useEffect(() => {
    const t = setTimeout(() => mmRef.current?.fit(), 100)
    return () => clearTimeout(t)
  }, [fullscreen])

  const downloadSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    clone.setAttribute("style", `background:${cssVar("--background")};color:${cssVar("--foreground")}`)
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const id = React.useId()

  return (
    <div
      ref={wrapRef}
      className={cn("flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-3 not-prose", fullscreen && "rounded-none border-0 p-4", className)}
      style={fullscreen ? { height: "100dvh" } : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch id={`${id}-recall`} checked={recall} onCheckedChange={setRecall} aria-label="Recall mode" />
          <Label htmlFor={`${id}-recall`} className="text-sm">
            Recall mode
          </Label>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {recall ? "Say each branch aloud, then click it to check." : "Everything is open."}
          </span>
        </div>
        <TooltipProvider>
          <ButtonGroup>
            <ToolButton label="Open all branches" icon={ArrowExpand01Icon} onClick={() => render("none")} />
            <ToolButton label="Fold all branches" icon={ArrowShrink01Icon} onClick={() => render("recall")} />
            <ToolButton label="Fit to screen" icon={FitToScreenIcon} onClick={() => mmRef.current?.fit()} />
            <ToolButton
              label="Full screen"
              icon={FullScreenIcon}
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen()
                else wrapRef.current?.requestFullscreen()
              }}
            />
            <ToolButton label="Download as SVG" icon={Download01Icon} onClick={downloadSvg} />
          </ButtonGroup>
        </TooltipProvider>
      </div>
      <svg
        ref={svgRef}
        className={cn("markmap w-full overflow-hidden rounded-xl bg-background", fullscreen && "flex-1")}
        style={fullscreen ? { minHeight: 0 } : { height: `min(${height}px, 72svh)`, minHeight: 260 }}
        role="img"
        aria-label={title}
      />
      {!ready && <p className="text-sm text-muted-foreground">Drawing the mindmap…</p>}
      <noscript>
        <pre className="whitespace-pre-wrap text-sm">{markdown}</pre>
      </noscript>
    </div>
  )
}

export default Mindmap
