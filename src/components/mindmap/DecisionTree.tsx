import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowTurnBackwardIcon, CheckmarkCircle02Icon, RepeatIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export interface TreeNode {
  q?: string
  answer?: string
  example?: string
  options?: { label: string; next: TreeNode }[]
}

interface DecisionTreeProps {
  title: string
  description?: string
  root: TreeNode
  colorVar?: string
}

/** Step-by-step: answer one question at a time until the right form appears. */
export function DecisionTree({ title, description, root, colorVar = "--primary" }: DecisionTreeProps) {
  const [path, setPath] = React.useState<number[]>([])
  const [showAll, setShowAll] = React.useState(false)
  const id = React.useId()

  const nodes: TreeNode[] = [root]
  for (const step of path) nodes.push(nodes[nodes.length - 1].options![step].next)
  const node = nodes[nodes.length - 1]

  return (
    <Card className="not-prose" style={{ borderTop: `4px solid var(${colorVar})` }}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Switch id={id} checked={showAll} onCheckedChange={setShowAll} aria-label="Show the whole tree" />
          <Label htmlFor={id}>Show the whole tree</Label>
        </div>

        {showAll ? (
          <TreeOutline node={root} />
        ) : (
          <>
            {path.length > 0 && (
              <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
                {path.map((step, i) => (
                  <li key={i}>
                    {nodes[i].q} → <strong className="text-foreground">{nodes[i].options![step].label}</strong>
                  </li>
                ))}
              </ol>
            )}
            {node.options?.length ? (
              <div className="flex flex-col gap-3">
                <p className="text-lg font-bold">{node.q}</p>
                <div className="flex flex-wrap gap-2">
                  {node.options.map((option, i) => (
                    <Button key={i} variant="outline" onClick={() => setPath([...path, i])}>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: `var(${colorVar}-soft, var(--accent))` }}>
                <p className="flex items-center gap-2 text-lg font-bold">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                  {node.answer}
                </p>
                {node.example && <p className="text-base">{node.example}</p>}
              </div>
            )}
            {path.length > 0 && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPath(path.slice(0, -1))}>
                  <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} data-icon="inline-start" />
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPath([])}>
                  <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} data-icon="inline-start" />
                  Start again
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TreeOutline({ node }: { node: TreeNode }) {
  if (!node.options?.length) {
    return (
      <span>
        <strong>{node.answer}</strong>
        {node.example && <span className="text-muted-foreground"> · {node.example}</span>}
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="font-bold">{node.q}</span>
      <ul className="flex flex-col gap-1 border-l-2 pl-4">
        {node.options.map((o, i) => (
          <li key={i}>
            <span className="text-muted-foreground">{o.label} → </span>
            <TreeOutline node={o.next} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DecisionTree
