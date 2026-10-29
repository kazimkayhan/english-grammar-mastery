import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export interface SearchItem {
  group: "Pages" | "Lessons" | "Grammar points" | "Glossary";
  href: string;
  keywords?: string;
  subtitle?: string;
  title: string;
}

const GROUPS: SearchItem["group"][] = [
  "Lessons",
  "Grammar points",
  "Glossary",
  "Pages",
];

/** Marks where the title ends inside an item's searchable value. */
const TITLE_END = " || ";
const WORD_SEPARATOR = /[\s/]+/u;
const NON_WORD_CHAR = /[^a-z0-9']/u;
const LEVEL_PREFIX = /^[a-c][12]\.\d+\s+/u;

/**
 * Every typed word must appear in the item (no fuzzy letter-skipping, which ranked
 * "Prepositions" above "present simple"). Matches at the start of a word, and in the
 * title, rank higher.
 */
export function searchScore(value: string, search: string): number {
  const words = search.toLowerCase().split(WORD_SEPARATOR).filter(Boolean);
  if (!words.length) {
    return 1;
  }
  const text = value.toLowerCase();
  const [title] = text.split(TITLE_END);
  let score = 0;
  for (const w of words) {
    const at = text.indexOf(w);
    if (at < 0) {
      return 0;
    }
    const wordStart = at === 0 || NON_WORD_CHAR.test(text[at - 1]);
    score += (wordStart ? 2 : 1) + (title.includes(w) ? 2 : 0);
  }
  // "present" should list "Present simple…" before "Mixed conditional: … present result".
  if (title.replace(LEVEL_PREFIX, "").startsWith(words[0])) {
    score += words.length * 2;
  }
  return score / (words.length * 4);
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (
        e.key === "/" &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || items) {
      return;
    }
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [open, items]);

  return (
    <>
      <Button
        className="text-muted-foreground max-w-xs min-w-0 flex-1 shrink justify-start"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <HugeiconsIcon
          data-icon="inline-start"
          icon={Search01Icon}
          strokeWidth={2}
        />
        <span className="truncate">Search grammar…</span>
        <KbdGroup className="ml-auto hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        description="Find any lesson, grammar point or grammar term"
        onOpenChange={setOpen}
        open={open}
        title="Search grammar"
      >
        <Command filter={searchScore}>
          <CommandInput placeholder="Try “present perfect”, “a/an”, “inversion”…" />
          <CommandList>
            <CommandEmpty>{items ? "Nothing found." : "Loading…"}</CommandEmpty>
            {items
              ? GROUPS.map((group) => {
                  const groupItems = items.filter((i) => i.group === group);
                  if (!groupItems.length) {
                    return null;
                  }
                  return (
                    <CommandGroup heading={group} key={group}>
                      {groupItems.map((item) => (
                        <CommandItem
                          key={`${group}-${item.href}-${item.title}`}
                          onSelect={() => {
                            window.location.href = item.href;
                          }}
                          value={`${item.title}${TITLE_END}${item.subtitle ?? ""} ${item.keywords ?? ""} ${group}`}
                        >
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{item.title}</span>
                            {item.subtitle ? (
                              <span className="text-muted-foreground truncate text-xs">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })
              : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
