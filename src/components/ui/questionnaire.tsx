"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import { cn } from "cn";
import type * as React from "react";
import { type Button, buttonVariants } from "@/components/ui/button";

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      className={cn("flex w-full min-w-0 flex-col gap-6", className)}
      data-slot="questionnaire"
      {...props}
    />
  );
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      className={cn(
        "text-muted-foreground min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium tabular-nums",
        className
      )}
      data-slot="questionnaire-progress"
      {...props}
    />
  );
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      className={cn(
        "flex min-w-0 flex-col gap-5 border-0 p-0 outline-none",
        className
      )}
      data-slot="questionnaire-item"
      {...props}
    />
  );
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      className={cn(
        "font-heading text-base font-semibold text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-5",
        className
      )}
      data-slot="questionnaire-title"
      {...props}
    />
  );
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      className={cn("text-muted-foreground text-sm text-pretty", className)}
      data-slot="questionnaire-description"
      {...props}
    />
  );
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      className={cn(
        "group/questionnaire-choices grid min-w-0 gap-3",
        className
      )}
      data-slot="questionnaire-choices"
      {...props}
    />
  );
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      className={cn(
        "group/questionnaire-choice border-input hover:bg-input/40 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive data-checked:border-primary/40 data-checked:bg-primary/10 relative flex min-h-11 cursor-pointer items-start gap-3 rounded-4xl border px-4 py-3.5 text-start text-sm transition-colors outline-none select-none has-[>input:focus-visible]:ring-[3px]",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      data-slot="questionnaire-choice"
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        data-slot="questionnaire-choice-input"
      />
      <span
        aria-hidden="true"
        className="border-input group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:bg-input/30 dark:group-data-checked/questionnaire-choice:bg-primary pointer-events-none relative flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[6px] border group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full"
        data-slot="questionnaire-choice-indicator"
      >
        <span
          className="bg-primary-foreground hidden size-2 rounded-full group-data-checked/questionnaire-choice:block group-data-[type=checkbox]/questionnaire-choice:hidden"
          data-slot="questionnaire-choice-indicator-dot"
        />
        <HugeiconsIcon
          className="hidden size-3.5 group-data-checked/questionnaire-choice:block group-data-[type=radio]/questionnaire-choice:hidden"
          data-slot="questionnaire-choice-indicator-check"
          icon={Tick02Icon}
          strokeWidth={2}
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        className="flex min-w-0 flex-1 flex-col gap-1 leading-snug"
        data-slot="questionnaire-choice-label"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        className="border-input bg-background/80 text-muted-foreground pointer-events-none ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-full border font-mono text-[0.625rem] leading-none font-medium group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex"
        data-slot="questionnaire-choice-shortcut"
      />
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-muted-foreground", className)}
      data-slot="questionnaire-choice-description"
      {...props}
    />
  );
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      className="group/questionnaire-input relative w-full min-w-0"
      data-slot="questionnaire-input-wrapper"
    >
      <QuestionnairePrimitive.Input
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-9 min-h-11 w-full min-w-0 rounded-4xl border px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px] sm:min-h-0 md:text-sm",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className
        )}
        data-slot="questionnaire-input"
        {...props}
      />
    </div>
  );
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      className={cn("text-destructive mt-2 text-sm", className)}
      data-slot="questionnaire-error"
      {...props}
    />
  );
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-9",
        className
      )}
      data-slot="questionnaire-actions"
      {...props}
    />
  );
}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Previous
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className
      )}
      data-size={size}
      data-slot="questionnaire-previous"
      data-variant={variant}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Skip
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      data-size={size}
      data-slot="questionnaire-skip"
      data-variant={variant}
      {...props}
    >
      {children ?? "Skip"}
    </QuestionnairePrimitive.Skip>
  );
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Next
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      data-size={size}
      data-slot="questionnaire-next"
      data-variant={variant}
      {...props}
    >
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Submit
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
      data-size={size}
      data-slot="questionnaire-submit"
      data-variant={variant}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
