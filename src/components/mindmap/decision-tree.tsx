import {
  ArrowTurnBackwardIcon,
  CheckmarkCircle02Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { withOffsetKeys } from "@/lib/keys";

export interface TreeNode {
  answer?: string;
  example?: string;
  options?: { label: string; next: TreeNode }[];
  q?: string;
}

interface DecisionTreeProps {
  colorVar?: string;
  description?: string;
  root: TreeNode;
  title: string;
}

/** Step-by-step: answer one question at a time until the right form appears. */
export function DecisionTree({
  title,
  description,
  root,
  colorVar = "--primary",
}: DecisionTreeProps) {
  const [path, setPath] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const id = useId();

  const nodes: TreeNode[] = [root];
  for (const step of path) {
    const next = nodes.at(-1)?.options?.[step]?.next;
    if (next) {
      nodes.push(next);
    }
  }
  const node = nodes.at(-1) ?? root;

  return (
    <Card
      className="not-prose"
      style={{ borderTop: `4px solid var(${colorVar})` }}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Switch
            aria-label="Show the whole tree"
            checked={showAll}
            id={id}
            onCheckedChange={setShowAll}
          />
          <Label htmlFor={id}>Show the whole tree</Label>
        </div>

        {showAll ? (
          <TreeOutline node={root} />
        ) : (
          <>
            {path.length > 0 && (
              <ol className="text-muted-foreground flex flex-col gap-1 text-sm">
                {withOffsetKeys(path, (step) => String(step).length).map(
                  ({ item: step, index: i, key }) => (
                    <li key={key}>
                      {nodes[i].q} →{" "}
                      <strong className="text-foreground">
                        {nodes[i].options?.[step].label}
                      </strong>
                    </li>
                  )
                )}
              </ol>
            )}
            {node.options?.length ? (
              <div className="flex flex-col gap-3">
                <p className="text-lg font-bold">{node.q}</p>
                <div className="flex flex-wrap gap-2">
                  {withOffsetKeys(
                    node.options,
                    (option) => option.label.length
                  ).map(({ item: option, index: i, key }) => (
                    <Button
                      key={key}
                      onClick={() => setPath([...path, i])}
                      variant="outline"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col gap-2 rounded-xl p-4"
                style={{ background: `var(${colorVar}-soft, var(--accent))` }}
              >
                <p className="flex items-center gap-2 text-lg font-bold">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                  {node.answer}
                </p>
                {node.example ? (
                  <p className="text-base">{node.example}</p>
                ) : null}
              </div>
            )}
            {path.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setPath(path.slice(0, -1))}
                  size="sm"
                  variant="ghost"
                >
                  <HugeiconsIcon
                    data-icon="inline-start"
                    icon={ArrowTurnBackwardIcon}
                    strokeWidth={2}
                  />
                  Back
                </Button>
                <Button onClick={() => setPath([])} size="sm" variant="ghost">
                  <HugeiconsIcon
                    data-icon="inline-start"
                    icon={RepeatIcon}
                    strokeWidth={2}
                  />
                  Start again
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TreeOutline({ node }: { node: TreeNode }) {
  if (!node.options?.length) {
    return (
      <span>
        <strong>{node.answer}</strong>
        {node.example ? (
          <span className="text-muted-foreground"> · {node.example}</span>
        ) : null}
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="font-bold">{node.q}</span>
      <ul className="flex flex-col gap-1 border-l-2 pl-4">
        {withOffsetKeys(node.options, (o) => o.label.length).map(
          ({ item: o, key }) => (
            <li key={key}>
              <span className="text-muted-foreground">{o.label} → </span>
              <TreeOutline node={o.next} />
            </li>
          )
        )}
      </ul>
    </div>
  );
}
