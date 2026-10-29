"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { type ComponentProps, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { withOffsetKeys } from "@/lib/keys";

const codeBlockVariants = cva(
  "group/code-block has-[>[data-slot=code-block-content]:focus-visible]:ring-ring/50 relative flex w-full min-w-0 flex-col overflow-hidden rounded-xl text-sm has-[>[data-slot=code-block-content]:focus-visible]:ring-[3px] data-[size=sm]:rounded-lg data-[size=sm]:text-xs",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default:
          "border-input text-foreground has-[>[data-slot=code-block-content]:focus-visible]:border-ring dark:bg-input/30 border",
        destructive:
          "border-destructive/30 text-destructive dark:border-destructive/40 border",
      },
    },
  }
);

const TRAILING_NEWLINE = /\n$/u;

function CodeBlock({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"div"> &
  VariantProps<typeof codeBlockVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      className={cn(codeBlockVariants({ variant }), className)}
      data-size={size}
      data-slot="code-block"
      data-variant={variant}
      {...props}
    />
  );
}

function CodeBlockHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground group-data-[variant=destructive]/code-block:text-destructive flex min-w-0 shrink-0 items-center gap-2 px-4 pt-4 group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:pt-3 *:has-[>[data-slot=code-block-title]]:min-w-0",
        className
      )}
      data-slot="code-block-header"
      {...props}
    />
  );
}

function CodeBlockTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-foreground group-data-[variant=destructive]/code-block:text-destructive min-w-0 truncate font-sans text-sm font-medium group-data-[size=sm]/code-block:text-xs [&_svg]:pointer-events-none [&_svg]:inline-block [&_svg]:align-middle [&_svg:not([class*='size-'])]:size-4 group-data-[size=sm]/code-block:[&_svg:not([class*='size-'])]:size-3.5 *:[svg]:me-1.5",
        className
      )}
      data-slot="code-block-title"
      {...props}
    />
  );
}

function CodeBlockActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "[[data-slot=code-block]>&]:*:[button]:bg-background [[data-slot=code-block]>&]:*:[button]:ring-foreground/10 -my-1 ms-auto -me-1.5 flex shrink-0 items-center gap-1 [[data-slot=code-block]>&]:absolute [[data-slot=code-block]>&]:end-3 [[data-slot=code-block]>&]:top-3 [[data-slot=code-block]>&]:z-10 [[data-slot=code-block]>&]:m-0 [[data-slot=code-block]>&]:opacity-0 [[data-slot=code-block]>&]:transition-opacity [[data-slot=code-block]>&]:group-focus-within/code-block:opacity-100 [[data-slot=code-block]>&]:group-hover/code-block:opacity-100 group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:end-2 group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:top-2 [[data-slot=code-block]>&]:pointer-coarse:opacity-100 [[data-slot=code-block]>&]:*:[button]:ring-1",
        className
      )}
      data-slot="code-block-actions"
      {...props}
    />
  );
}

function CodeBlockCopyButton({
  value,
  variant = "ghost",
  size = "icon-xs",
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button> & { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <>
      <Button
        aria-label={copied ? "Copied" : "Copy"}
        className={cn(className)}
        data-copied={copied || undefined}
        data-slot="code-block-copy-button"
        onClick={(event) => {
          onClick?.(event);
          navigator.clipboard
            .writeText(value)
            .then(() => setCopied(true))
            .catch(() => {
              // Clipboard access can be denied; keep the copied state unchanged.
            });
        }}
        size={size}
        variant={variant}
        {...props}
      >
        {copied ? (
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
        ) : (
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}

function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  ...props
}: ComponentProps<"pre"> & {
  wrap?: boolean;
  lineNumbers?: boolean;
  startLine?: number;
}) {
  const numberedLines =
    lineNumbers && typeof children === "string"
      ? withOffsetKeys(
          children.replace(TRAILING_NEWLINE, "").split("\n"),
          (line) => line.length
        ).map(({ item: line, key }) => (
          <CodeBlockLine key={key}>{line}</CodeBlockLine>
        ))
      : null;

  return (
    <pre
      className={cn(
        "scroll-fade-x data-wrap:scroll-fade-y min-h-0 min-w-0 scrollbar-thin overflow-auto px-4 py-4 text-start font-mono leading-relaxed outline-none group-has-data-[slot=code-block-footer]/code-block:pb-2 group-has-data-[slot=code-block-header]/code-block:pt-2 group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:py-3 group-data-[size=sm]/code-block:group-has-data-[slot=code-block-header]/code-block:pt-1.5 data-wrap:wrap-break-word data-wrap:whitespace-pre-wrap",
        className
      )}
      data-numbered={lineNumbers || undefined}
      data-slot="code-block-content"
      data-wrap={wrap || undefined}
      dir="ltr"
      style={{ counterReset: `line ${startLine - 1}`, ...style }}
      {...props}
    >
      <code
        className="grid min-h-lh min-w-max content-start in-data-numbered:grid-cols-[auto_1fr] in-data-wrap:min-w-0"
        data-slot="code-block-code"
      >
        {numberedLines ?? children}
      </code>
    </pre>
  );
}

const codeBlockLineVariants = cva(
  "before:text-muted-foreground after:text-muted-foreground relative -mx-4 block min-h-lh px-4 group-data-[size=sm]/code-block:-mx-3 group-data-[size=sm]/code-block:px-3 before:min-w-6 before:text-end after:absolute after:start-1 after:top-0 after:select-none in-data-numbered:col-span-2 in-data-numbered:grid in-data-numbered:grid-cols-subgrid in-data-numbered:gap-x-3 in-data-numbered:[counter-increment:line] in-data-numbered:before:content-[counter(line)] in-data-numbered:before:select-none in-data-numbered:supports-[content:counter(line)_/_'']:before:content-[counter(line)_/_'']",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        added: "bg-muted after:content-['+']",
        default: "",
        highlighted: "bg-muted",
        removed: "bg-destructive/10 after:text-destructive after:content-['−']",
      },
    },
  }
);

function CodeBlockLine({
  className,
  variant = "default",
  children,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof codeBlockLineVariants>) {
  // An empty line holds a newline so copying a selection keeps blank lines.
  const empty =
    children === undefined ||
    children === null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0);

  return (
    <span
      className={cn(codeBlockLineVariants({ variant }), className)}
      data-slot="code-block-line"
      data-variant={variant}
      {...props}
    >
      <span className="min-w-0" data-slot="code-block-line-content">
        {empty ? "\n" : null}
        {!empty && children}
      </span>
    </span>
  );
}

function CodeBlockFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex min-w-0 shrink-0 items-center gap-2 px-4 pb-4 group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:pb-3",
        className
      )}
      data-slot="code-block-footer"
      {...props}
    />
  );
}

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
};
