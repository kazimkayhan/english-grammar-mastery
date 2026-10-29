import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { type KeyboardEvent, useId, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  checkGap,
  checkMatch,
  checkReorder,
  type Exercise,
  matchesAny,
  modelAnswer,
  reorderAnswer,
  seededShuffle,
} from "@/lib/exercises";
import { withOffsetKeys } from "@/lib/keys";
import { splitLessonRefs } from "@/lib/lesson-refs";

type Status = "idle" | "right" | "wrong";

const TYPE_LABEL: Record<Exercise["type"], string> = {
  correct: "Correct the mistake",
  gap: "Fill the gap",
  match: "Match",
  mcq: "Choose",
  reorder: "Put in order",
  transform: "Rewrite",
};

const CARD_RING: Record<Status, string | undefined> = {
  idle: undefined,
  right: "ring-success/40 ring-2",
  wrong: "ring-mistake/40 ring-2",
};

const PROMPT_TONE: Record<Status, string> = {
  idle: "border-primary text-primary",
  right: "border-success text-success",
  wrong: "border-mistake text-mistake",
};

interface ExerciseSetProps {
  exercises: Exercise[];
  /** Stable seed so shuffles match between server and browser. */
  seed: string;
  title?: string;
}

export function ExerciseSet({
  exercises,
  seed,
  title = "Practice",
}: ExerciseSetProps) {
  const [results, setResults] = useState<Status[]>(() =>
    exercises.map(() => "idle")
  );
  const [round, setRound] = useState(0);
  const checked = results.filter((r) => r !== "idle").length;
  const right = results.filter((r) => r === "right").length;
  const done = checked === exercises.length;

  const setResult = (i: number, status: Status) =>
    setResults((prev) => prev.map((r, j) => (j === i ? status : r)));

  return (
    <section aria-label={title} className="not-prose flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          <Progress
            aria-label="Exercises checked"
            className="w-32"
            value={(checked / exercises.length) * 100}
          />
          <span className="text-muted-foreground text-sm tabular-nums">
            {right}/{exercises.length} right
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-4">
        {withOffsetKeys(exercises, (ex) => ex.explain.length).map(
          ({ item: ex, index: i, key }) => (
            <li key={`${round}-${key}`}>
              <ExerciseCard
                exercise={ex}
                index={i}
                onResult={(status) => setResult(i, status)}
                seed={`${seed}-${i}`}
              />
            </li>
          )
        )}
      </ol>

      {done && (
        <Alert
          className={
            right === exercises.length
              ? "border-success/40 bg-success-soft"
              : ""
          }
        >
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
            onClick={() => {
              setResults(exercises.map(() => "idle"));
              setRound((r) => r + 1);
            }}
            variant="outline"
          >
            <HugeiconsIcon
              data-icon="inline-start"
              icon={RepeatIcon}
              strokeWidth={2}
            />
            Start the set again
          </Button>
        </div>
      )}
    </section>
  );
}

function ExerciseCard({
  exercise,
  index,
  seed,
  onResult,
}: {
  exercise: Exercise;
  index: number;
  seed: string;
  onResult: (status: Status) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);

  const finish = (ok: boolean) => {
    const next = ok ? "right" : "wrong";
    setStatus(next);
    onResult(next);
  };

  const check = () => {
    const ex = exercise;
    switch (ex.type) {
      case "mcq":
        return finish(answer === ex.answer);
      case "gap":
        return finish(
          checkGap(String(answer ?? ""), ex.prompt, ex.answers, {
            strict: ex.strict,
          })
        );
      case "correct":
        return finish(
          matchesAny(String(answer ?? ""), ex.answers, { strict: ex.strict })
        );
      case "transform": {
        const typed = String(answer ?? "");
        const full =
          ex.start &&
          !typed.trim().toLowerCase().startsWith(ex.start.toLowerCase())
            ? `${ex.start} ${typed}`
            : typed;
        return finish(matchesAny(full, ex.answers));
      }
      case "reorder":
        return finish(
          checkReorder(
            (answer as string[] | null) ?? [],
            ex.chunks,
            ex.alternatives
          )
        );
      case "match":
        return finish(
          checkMatch((answer as Record<string, string> | null) ?? {}, ex.pairs)
        );
      default:
        return;
    }
  };

  const retry = () => {
    setStatus("idle");
    setAnswer(null);
    setAttempt((a) => a + 1);
    onResult("idle");
  };

  const locked = status !== "idle";
  const canCheck =
    answer !== null &&
    !(typeof answer === "string" && !answer.trim()) &&
    !(Array.isArray(answer) && answer.length === 0);

  return (
    <Card className={CARD_RING[status]}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-muted flex size-7 items-center justify-center rounded-full text-sm tabular-nums">
            {index + 1}
          </span>
          <Badge variant="secondary">{TYPE_LABEL[exercise.type]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4" key={attempt}>
        <ExerciseBody
          answer={answer}
          exercise={exercise}
          locked={locked}
          onChange={setAnswer}
          onSubmit={check}
          seed={seed}
          status={status}
        />
        {status !== "idle" && (
          <Alert
            className={
              status === "right"
                ? "border-success/40 bg-success-soft"
                : "border-mistake/40 bg-mistake-soft"
            }
          >
            <HugeiconsIcon
              icon={status === "right" ? CheckmarkCircle02Icon : Cancel01Icon}
              strokeWidth={2}
            />
            <AlertTitle>
              {status === "right" ? "Correct!" : "Not quite."}
            </AlertTitle>
            <AlertDescription className="text-foreground flex flex-col gap-1">
              {status === "wrong" && (
                <span>
                  Answer: <strong>{modelAnswer(exercise)}</strong>
                </span>
              )}
              <span>
                {withOffsetKeys(
                  splitLessonRefs(exercise.explain),
                  (part) => part.text.length
                ).map(({ item: part, key }) =>
                  part.ref ? (
                    <span className="lesson-ref" key={key}>
                      {part.text}
                    </span>
                  ) : (
                    <React.Fragment key={key}>{part.text}</React.Fragment>
                  )
                )}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {status === "idle" ? (
          <Button disabled={!canCheck} onClick={check}>
            Check
          </Button>
        ) : (
          <Button onClick={retry} variant="outline">
            <HugeiconsIcon
              data-icon="inline-start"
              icon={RepeatIcon}
              strokeWidth={2}
            />
            Try again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
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
  exercise: Exercise;
  seed: string;
  locked: boolean;
  answer: unknown;
  status: Status;
  onChange: (value: unknown) => void;
  onSubmit: () => void;
}) {
  const id = useId();
  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  switch (exercise.type) {
    case "mcq":
      return (
        <div className="flex flex-col gap-3">
          <Prompt
            fill={
              typeof answer === "number" ? exercise.options[answer] : undefined
            }
            status={status}
            text={exercise.prompt}
          />
          <RadioGroup
            aria-label={exercise.prompt}
            disabled={locked}
            onValueChange={(v) => onChange(Number(v))}
          >
            {withOffsetKeys(exercise.options, (option) => option.length).map(
              ({ item: option, index: i, key }) => (
                <FieldLabel htmlFor={`${id}-${i}`} key={key}>
                  <Field orientation="horizontal">
                    <RadioGroupItem
                      aria-label={option}
                      id={`${id}-${i}`}
                      value={String(i)}
                    />
                    <FieldContent>
                      <FieldTitle className="text-base font-normal">
                        {option}
                      </FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              )
            )}
          </RadioGroup>
        </div>
      );

    case "gap":
      return (
        <Field>
          <FieldLabel className="flex-wrap text-base font-normal" htmlFor={id}>
            <Prompt
              fill={typeof answer === "string" ? answer : undefined}
              status={status}
              text={exercise.prompt}
            />
            {exercise.base ? (
              <Badge variant="outline">{exercise.base}</Badge>
            ) : null}
          </FieldLabel>
          <Input
            autoCapitalize="off"
            autoComplete="off"
            disabled={locked}
            id={id}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Type the missing word(s)"
            spellCheck={false}
          />
        </Field>
      );

    case "correct":
      return (
        <Field>
          <FieldLabel className="text-base font-normal" htmlFor={id}>
            There is one mistake. Fix it in the box below.
          </FieldLabel>
          <Textarea
            autoComplete="off"
            className="text-base"
            defaultValue={exercise.prompt}
            disabled={locked}
            id={id}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => onChange(e.target.value)}
            onKeyDown={onEnter}
            rows={2}
            spellCheck={false}
          />
          {typeof answer === "string" && answer !== exercise.prompt && (
            <FieldDescription>
              Original:{" "}
              <s className="decoration-mistake/60">{exercise.prompt}</s>
            </FieldDescription>
          )}
        </Field>
      );

    case "transform":
      return (
        <Field>
          <FieldLabel
            className="flex flex-col items-start gap-2 text-base font-normal"
            htmlFor={id}
          >
            <Prompt text={exercise.prompt} />
            {exercise.keyword ? (
              <span className="text-muted-foreground text-sm">
                Use the word <Badge>{exercise.keyword}</Badge>
              </span>
            ) : null}
          </FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {exercise.start ? (
              <span className="text-muted-foreground shrink-0 text-base">
                {exercise.start}
              </span>
            ) : null}
            <Input
              autoComplete="off"
              disabled={locked}
              id={id}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onEnter}
              placeholder="Write your sentence"
              spellCheck={false}
            />
          </div>
        </Field>
      );

    case "reorder":
      return (
        <ReorderBody
          chunks={exercise.chunks}
          locked={locked}
          onChange={onChange}
          seed={seed}
        />
      );

    case "match":
      return (
        <MatchBody
          exercise={exercise}
          locked={locked}
          onChange={onChange}
          seed={seed}
        />
      );

    default:
      return null;
  }
}

/** The sentence with its ___ blank; shows the learner's answer inside the blank as they choose or type. */
function Prompt({
  text,
  fill,
  status = "idle",
}: {
  text: string;
  fill?: string;
  status?: Status;
}) {
  const parts = text.split("___");
  const tone = PROMPT_TONE[status];
  return (
    <span className="text-base leading-relaxed">
      {withOffsetKeys(parts, (part) => part.length).map(
        ({ item: part, index: i, key }) => (
          <React.Fragment key={key}>
            {part}
            {i < parts.length - 1 && (
              <span
                className={`mx-1 inline-block min-w-14 border-b-2 px-1 text-center align-baseline font-bold ${
                  fill?.trim()
                    ? `border-solid ${tone}`
                    : "border-primary border-dashed"
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
        )
      )}
    </span>
  );
}

function ReorderBody({
  chunks,
  seed,
  locked,
  onChange,
}: {
  chunks: string[];
  seed: string;
  locked: boolean;
  onChange: (value: string[]) => void;
}) {
  const pool = useMemo(
    () =>
      seededShuffle(
        chunks.map((c, i) => ({ c, i })),
        seed
      ),
    [chunks, seed]
  );
  const [picked, setPicked] = useState<number[]>([]);
  const chosen = picked.map((p) => pool[p].c);

  const update = (next: number[]) => {
    setPicked(next);
    onChange(next.map((p) => pool[p].c));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Tap the words in the right order. Tap a chosen word to remove it.
      </p>
      <div
        aria-live="polite"
        className="bg-muted/40 flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-dashed p-2"
      >
        {picked.length === 0 && (
          <span className="text-muted-foreground px-1 text-sm">
            Your sentence appears here
          </span>
        )}
        {picked.map((p, i) => (
          <Button
            disabled={locked}
            key={p}
            onClick={() => update(picked.filter((_, j) => j !== i))}
            size="sm"
            variant="secondary"
          >
            {pool[p].c}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((item) =>
          picked.includes(item.i) ? null : (
            <Button
              disabled={locked}
              key={item.i}
              onClick={() => update([...picked, item.i])}
              size="sm"
              variant="outline"
            >
              {item.c}
            </Button>
          )
        )}
      </div>
      {chosen.length > 0 && (
        <p className="text-muted-foreground text-sm">
          “{reorderAnswer(chosen)}”
        </p>
      )}
    </div>
  );
}

function MatchBody({
  exercise,
  seed,
  locked,
  onChange,
}: {
  exercise: Extract<Exercise, { type: "match" }>;
  seed: string;
  locked: boolean;
  onChange: (value: Record<string, string>) => void;
}) {
  const rights = useMemo(
    () =>
      seededShuffle(
        exercise.pairs.map(([, r]) => r),
        seed
      ),
    [exercise.pairs, seed]
  );
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      <Prompt text={exercise.prompt} />
      {exercise.pairs.map(([left], i) => (
        <Field key={left} orientation="responsive">
          <FieldLabel className="text-base font-normal" htmlFor={`${id}-${i}`}>
            {left}
          </FieldLabel>
          <Select
            disabled={locked}
            id={`${id}-${i}`}
            onValueChange={(value) => {
              const next = { ...chosen, [left]: value ?? "" };
              setChosen(next);
              onChange(next);
            }}
            value={chosen[left] ?? null}
          >
            <SelectTrigger className="h-10 w-full text-base sm:max-w-xs">
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              {rights.map((r) => (
                <SelectItem className="text-base" key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ))}
    </div>
  );
}
