import {
  ArrowExpand01Icon,
  ArrowShrink01Icon,
  Download01Icon,
  FitToScreenIcon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseOutline } from "@/lib/outline";
import { cn } from "@/lib/utils";

type Markmap = import("markmap-view").Markmap;
type Root = Parameters<Markmap["setData"]>[0];
type MapNode = NonNullable<Root> & {
  payload?: { fold?: number; branch?: number };
  children?: MapNode[];
};

interface MindmapProps {
  /** CSS colour variables for each first-level branch, in order (colors="branches"). */
  branchColors?: string[];
  className?: string;
  /** "lesson": one colour (colorVar) for the whole map; "branches": one colour per first-level branch. */
  colors?: "lesson" | "families" | "branches";
  /** CSS colour variable for colors="lesson", e.g. "--fam-verbs". */
  colorVar?: string;
  height?: number;
  /** Outline markdown: "# Root", "## Branch", "- leaf". */
  markdown: string;
  /** Start folded so the learner recalls before revealing. */
  recallDefault?: boolean;
  title?: string;
}

const FAMILY_VARS = [
  "--fam-words",
  "--fam-verbs",
  "--fam-sentences",
  "--fam-text",
];
const BRANCH_VARS = [
  "--fam-verbs",
  "--fam-sentences",
  "--fam-words",
  "--fam-text",
  "--persian",
  "--primary",
];

/** An icon button with a visible name on hover and focus, so its purpose is clear before clicking. */
function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            onClick={onClick}
            size="icon-sm"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function cssVar(name: string) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "currentColor"
  );
}

function setFold(node: MapNode, fold: (depth: number) => boolean, depth = 1) {
  node.payload = {
    ...node.payload,
    fold: node.children?.length && fold(depth) ? 1 : 0,
  };
  for (const c of node.children ?? []) {
    setFold(c, fold, depth + 1);
  }
}

/** Tag every node with the index of its first-level branch (root = -1) for colouring. */
function tagBranches(root: MapNode) {
  root.payload = { ...root.payload, branch: -1 };
  const walk = (node: MapNode, branch: number) => {
    node.payload = { ...node.payload, branch };
    for (const c of node.children ?? []) {
      walk(c, branch);
    }
  };
  for (const [i, c] of (root.children ?? []).entries()) {
    walk(c, i);
  }
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const [recall, setRecall] = useState(recallDefault);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const colorFn = useCallback(
    (node: MapNode) => {
      const branch = node.payload?.branch ?? -1;
      if (branch < 0) {
        return cssVar("--muted-foreground");
      }
      if (colors === "lesson") {
        return cssVar(colorVar);
      }
      const vars =
        branchColors ?? (colors === "families" ? FAMILY_VARS : BRANCH_VARS);
      return cssVar(vars[branch % vars.length]);
    },
    [colors, colorVar, branchColors]
  );

  const render = useCallback(
    async (foldMode: "recall" | "none") => {
      if (!svgRef.current) {
        return;
      }
      const { Markmap } = await import("markmap-view");
      const data = parseOutline(markdown, title) as MapNode;
      tagBranches(data);
      setFold(data, foldMode === "recall" ? (d) => d >= 2 : () => false);
      mmRef.current?.destroy();
      svgRef.current.innerHTML = "";
      // On a phone the map is limited by width, so narrower labels and gaps keep the text readable.
      const narrow = matchMedia("(max-width: 639px)").matches;
      mmRef.current = Markmap.create(
        svgRef.current,
        {
          autoFit: true,
          color: colorFn as never,
          duration: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 300,
          fitRatio: 0.9,
          initialExpandLevel: -1,
          maxWidth: narrow ? 150 : 260,
          paddingX: 12,
          pan: true,
          scrollForPan: false,
          spacingHorizontal: narrow ? 40 : 90,
          spacingVertical: 10,
          zoom: true,
        },
        data as Root
      );
      setReady(true);
    },
    [markdown, title, colorFn]
  );

  // On small screens a fully open map is too tiny to read: start folded (recall first anyway).
  useEffect(() => {
    if (!recallDefault && window.matchMedia("(max-width: 639px)").matches) {
      setRecall(true);
    }
  }, [recallDefault]);

  useEffect(() => {
    render(recall ? "recall" : "none");
    // Re-colour when the reading theme changes.
    const observer = new MutationObserver(() =>
      render(recall ? "recall" : "none")
    );
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
      attributes: true,
    });
    return () => {
      observer.disconnect();
      mmRef.current?.destroy();
      mmRef.current = null;
    };
  }, [render, recall]);

  // Track full screen (the Escape key also leaves it), and refit the map once its new size is laid out.
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === wrapRef.current);
      setTimeout(() => mmRef.current?.fit(), 100);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => mmRef.current?.fit(), 100);
    return () => clearTimeout(t);
  }, []);

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute(
      "style",
      `background:${cssVar("--background")};color:${cssVar("--foreground")}`
    );
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const id = useId();

  return (
    <div
      className={cn(
        "bg-card not-prose flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border p-3",
        fullscreen && "rounded-none border-0 p-4",
        className
      )}
      ref={wrapRef}
      style={fullscreen ? { height: "100dvh" } : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch
            aria-label="Recall mode"
            checked={recall}
            id={`${id}-recall`}
            onCheckedChange={setRecall}
          />
          <Label className="text-sm" htmlFor={`${id}-recall`}>
            Recall mode
          </Label>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {recall
              ? "Say each branch aloud, then click it to check."
              : "Everything is open."}
          </span>
        </div>
        <TooltipProvider>
          <ButtonGroup>
            <ToolButton
              icon={ArrowExpand01Icon}
              label="Open all branches"
              onClick={() => render("none")}
            />
            <ToolButton
              icon={ArrowShrink01Icon}
              label="Fold all branches"
              onClick={() => render("recall")}
            />
            <ToolButton
              icon={FitToScreenIcon}
              label="Fit to screen"
              onClick={() => mmRef.current?.fit()}
            />
            <ToolButton
              icon={FullScreenIcon}
              label="Full screen"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  wrapRef.current?.requestFullscreen();
                }
              }}
            />
            <ToolButton
              icon={Download01Icon}
              label="Download as SVG"
              onClick={downloadSvg}
            />
          </ButtonGroup>
        </TooltipProvider>
      </div>
      <svg
        aria-label={title}
        className={cn(
          "markmap bg-background w-full overflow-hidden rounded-xl",
          fullscreen && "flex-1"
        )}
        ref={svgRef}
        role="img"
        style={
          fullscreen
            ? { minHeight: 0 }
            : { height: `min(${height}px, 72svh)`, minHeight: 260 }
        }
      />
      {!ready && (
        <p className="text-muted-foreground text-sm">Drawing the mindmap…</p>
      )}
      <noscript>
        <pre className="text-sm whitespace-pre-wrap">{markdown}</pre>
      </noscript>
    </div>
  );
}
