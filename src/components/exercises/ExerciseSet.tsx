import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, CheckmarkCircle02Icon, RepeatIcon } from "@hugeicons/core-free-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  checkGap,
  checkMatch,
  checkReorder,
  matchesAny,
  modelAnswer,
  reorderAnswer,
  seededShuffle,
  type Exercise,
} from "@/lib/exercises"

type Status = "idle" | "right" | "wrong"

const TYPE_LABEL: Record<Exercise["type"], string> = {
  mcq: "Choose",
  gap: "Fill the gap",
  correct: "Correct the mistake",
  reorder: "Put in order",
  transform: "Rewrite",
  match: "Match",
}

interface ExerciseSetProps {
  exercises: Exercise[]
  /** Stable seed so shuffles match between server and browser. */
  seed: string
  title?: string
}

export function ExerciseSet({ exercises, seed, title = "Practice" }: ExerciseSetProps) {
  const [results, setResults] = React.useState<Status[]>(() => exercises.map(() => "idle"))
  const [round, setRound] = React.useState(0)
  const checked = results.filter((r) => r !== "idle").length
  const right = results.filter((r) => r === "right").length
  const done = checked === exercises.length

  const setResult = (i: number, status: Status) =>
    setResults((prev) => prev.map((r, j) => (j === i ? status : r)))

  return (
    <section className="flex flex-col gap-4 not-prose" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          <Progress value={(checked / exercises.length) * 100} className="w-32" aria-label="Exercises checked" />
          <span className="text-sm text-muted-foreground tabular-nums">
            {right}/{exercises.length} right
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-4">
        {exercises.map((ex, i) => (
          <li key={`${round}-${i}`}>
            <ExerciseCard
              exercise={ex}
              index={i}
              seed={`${seed}-${i}`}
              onResult={(status) => setResult(i, status)}
            />
          </li>
        ))}
      </ol>

      {done && (
        <Alert className={right === exercises.length ? "border-success/40 bg-success-soft" : ""}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>
            You got {right} out of {exercises.length}
            {right === exercises.length ? ". Perfect!" : "."}
          </AlertTitle>
          <AlertDescription>
            {right === exercises.length
              ? "Great work. Add the flashcards below so you keep it."
              : "Read the explanations for the ones you missed, then try the set again."}
          </AlertDescription>
        </Alert>
      )}
      {checked > 0 && (
        <div>
          <Button
            variant="outline"
            onClick={() => {
              setResults(exercises.map(() => "idle"))
              setRound((r) => r + 1)
            }}
          >
            <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} data-icon="inline-start" />
            Start the set again
          </Button>
        </div>
      )}
    </section>
  )
}

function ExerciseCard({
  exercise,
  index,
  seed,
  onResult,
}: {
  exercise: Exercise
  index: number
  seed: string
  onResult: (status: Status) => void
}) {
  const [status, setStatus] = React.useState<Status>("idle")
  const [attempt, setAttempt] = React.useState(0)
  const [answer, setAnswer] = React.useState<unknown>(null)

  const finish = (ok: boolean) => {
    const next = ok ? "right" : "wrong"
    setStatus(next)
    onResult(next)
  }

  const check = () => {
    const ex = exercise
    switch (ex.type) {
      case "mcq":
        return finish(answer === ex.answer)
      case "gap":
        return finish(checkGap(String(answer ?? ""), ex.prompt, ex.answers, { strict: ex.strict }))
      case "correct":
        return finish(matchesAny(String(answer ?? ""), ex.answers, { strict: ex.strict }))
      case "transform": {
        const typed = String(answer ?? "")
        const full = ex.start && !typed.trim().toLowerCase().startsWith(ex.start.toLowerCase()) ? `${ex.start} ${typed}` : typed
        return finish(matchesAny(full, ex.answers))
      }
      case "reorder":
        return finish(checkReorder((answer as string[]) ?? [], ex.chunks, ex.alternatives))
      case "match":
        return finish(checkMatch((answer as Record<string, string>) ?? {}, ex.pairs))
    }
  }

  const retry = () => {
    setStatus("idle")
    setAnswer(null)
    setAttempt((a) => a + 1)
    onResult("idle")
  }

  const locked = status !== "idle"
  const canCheck =
    answer !== null &&
    !(typeof answer === "string" && !answer.trim()) &&
    !(Array.isArray(answer) && answer.length === 0)

  return (
    <Card
      className={
        status === "right" ? "ring-2 ring-success/40" : status === "wrong" ? "ring-2 ring-mistake/40" : undefined
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm tabular-nums">
            {index + 1}
          </span>
          <Badge variant="secondary">{TYPE_LABEL[exercise.type]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent key={attempt} className="flex flex-col gap-4">
        <ExerciseBody
          exercise={exercise}
          seed={seed}
          locked={locked}
          answer={answer}
          status={status}
          onChange={setAnswer}
          onSubmit={check}
        />
        {status !== "idle" && (
          <Alert className={status === "right" ? "border-success/40 bg-success-soft" : "border-mistake/40 bg-mistake-soft"}>
            <HugeiconsIcon icon={status === "right" ? CheckmarkCircle02Icon : Cancel01Icon} strokeWidth={2} />
            <AlertTitle>{status === "right" ? "Correct!" : "Not quite."}</AlertTitle>
            <AlertDescription className="flex flex-col gap-1 text-foreground">
              {status === "wrong" && (
                <span>
                  Answer: <strong>{modelAnswer(exercise)}</strong>
                </span>
              )}
              <span>{exercise.explain}</span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {status === "idle" ? (
          <Button onClick={check} disabled={!canCheck}>
            Check
          </Button>
        ) : (
          <Button variant="outline" onClick={retry}>
            <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} data-icon="inline-start" />
            Try again
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function ExerciseBody({
  exercise,
  seed,
  locked,
  answer,
  status,
  onChange,
  onSubmit,
}: {
  exercise: Exercise
  seed: string
  locked: boolean
  answer: unknown
  status: Status
  onChange: (value: unknown) => void
  onSubmit: () => void
}) {
  const id = React.useId()
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  switch (exercise.type) {
    case "mcq":
      return (
        <div className="flex flex-col gap-3">
          <Prompt
            text={exercise.prompt}
            fill={typeof answer === "number" ? exercise.options[answer] : undefined}
            status={status}
          />
          <RadioGroup onValueChange={(v) => onChange(Number(v))} disabled={locked} aria-label={exercise.prompt}>
            {exercise.options.map((option, i) => (
              <FieldLabel key={i} htmlFor={`${id}-${i}`}>
                <Field orientation="horizontal">
                  <RadioGroupItem value={String(i)} id={`${id}-${i}`} aria-label={option} />
                  <FieldContent>
                    <FieldTitle className="text-base font-normal">{option}</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </div>
      )

    case "gap":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="flex-wrap text-base font-normal">
            <Prompt text={exercise.prompt} fill={typeof answer === "string" ? answer : undefined} status={status} />
            {exercise.base && <Badge variant="outline">{exercise.base}</Badge>}
          </FieldLabel>
          <Input
            id={id}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type the missing word(s)"
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onEnter}
          />
        </Field>
      )

    case "correct":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="text-base font-normal">
            There is one mistake. Fix it in the box below.
          </FieldLabel>
          <Textarea
            id={id}
            rows={2}
            autoComplete="off"
            spellCheck={false}
            defaultValue={exercise.prompt}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => onChange(e.target.value)}
            onKeyDown={onEnter}
            className="text-base"
          />
          {typeof answer === "string" && answer !== exercise.prompt && (
            <FieldDescription>
              Original: <s className="decoration-mistake/60">{exercise.prompt}</s>
            </FieldDescription>
          )}
        </Field>
      )

    case "transform":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="flex flex-col items-start gap-2 text-base font-normal">
            <Prompt text={exercise.prompt} />
            {exercise.keyword && (
              <span className="text-sm text-muted-foreground">
                Use the word <Badge>{exercise.keyword}</Badge>
              </span>
            )}
          </FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {exercise.start && <span className="shrink-0 text-base text-muted-foreground">{exercise.start}</span>}
            <Input
              id={id}
              autoComplete="off"
              spellCheck={false}
              placeholder="Write your sentence"
              disabled={locked}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onEnter}
            />
          </div>
        </Field>
      )

    case "reorder":
      return <ReorderBody chunks={exercise.chunks} seed={seed} locked={locked} onChange={onChange} />

    case "match":
      return <MatchBody exercise={exercise} seed={seed} locked={locked} onChange={onChange} />
  }
}

/** The sentence with its ___ blank; shows the learner's answer inside the blank as they choose or type. */
function Prompt({ text, fill, status = "idle" }: { text: string; fill?: string; status?: Status }) {
  const parts = text.split("___")
  const tone =
    status === "right"
      ? "border-success text-success"
      : status === "wrong"
        ? "border-mistake text-mistake"
        : "border-primary text-primary"
  return (
    <span className="text-base leading-relaxed">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              className={`mx-1 inline-block min-w-14 border-b-2 px-1 text-center align-baseline font-bold ${
                fill?.trim() ? `border-solid ${tone}` : "border-dashed border-primary"
              }`}
            >
              {fill?.trim() ? (
                fill.trim()
              ) : (
                <>
                  <span className="sr-only">(blank)</span>
                  <span aria-hidden="true">&nbsp;</span>
                </>
              )}
            </span>
          )}
        </React.Fragment>
      ))}
    </span>
  )
}

function ReorderBody({
  chunks,
  seed,
  locked,
  onChange,
}: {
  chunks: string[]
  seed: string
  locked: boolean
  onChange: (value: string[]) => void
}) {
  const pool = React.useMemo(() => seededShuffle(chunks.map((c, i) => ({ c, i })), seed), [chunks, seed])
  const [picked, setPicked] = React.useState<number[]>([])
  const chosen = picked.map((p) => pool[p].c)

  const update = (next: number[]) => {
    setPicked(next)
    onChange(next.map((p) => pool[p].c))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Tap the words in the right order. Tap a chosen word to remove it.</p>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-dashed bg-muted/40 p-2" aria-live="polite">
        {picked.length === 0 && <span className="px-1 text-sm text-muted-foreground">Your sentence appears here</span>}
        {picked.map((p, i) => (
          <Button key={`${p}-${i}`} size="sm" variant="secondary" disabled={locked} onClick={() => update(picked.filter((_, j) => j !== i))}>
            {pool[p].c}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((item, p) =>
          picked.includes(p) ? null : (
            <Button key={p} size="sm" variant="outline" disabled={locked} onClick={() => update([...picked, p])}>
              {item.c}
            </Button>
          ),
        )}
      </div>
      {chosen.length > 0 && <p className="text-sm text-muted-foreground">“{reorderAnswer(chosen)}”</p>}
    </div>
  )
}

function MatchBody({
  exercise,
  seed,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: "match" }>
  seed: string
  locked: boolean
  onChange: (value: Record<string, string>) => void
}) {
  const rights = React.useMemo(() => seededShuffle(exercise.pairs.map(([, r]) => r), seed), [exercise.pairs, seed])
  const [chosen, setChosen] = React.useState<Record<string, string>>({})
  const id = React.useId()

  return (
    <div className="flex flex-col gap-3">
      <Prompt text={exercise.prompt} />
      {exercise.pairs.map(([left], i) => (
        <Field key={left} orientation="responsive">
          <FieldLabel htmlFor={`${id}-${i}`} className="text-base font-normal">
            {left}
          </FieldLabel>
          <Select
            id={`${id}-${i}`}
            disabled={locked}
            value={chosen[left] ?? null}
            onValueChange={(value) => {
              const next = { ...chosen, [left]: value ?? "" }
              setChosen(next)
              onChange(next)
            }}
          >
            <SelectTrigger className="h-10 w-full text-base sm:max-w-xs">
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              {rights.map((r) => (
                <SelectItem key={r} value={r} className="text-base">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ))}
    </div>
  )
}

export default ExerciseSet
