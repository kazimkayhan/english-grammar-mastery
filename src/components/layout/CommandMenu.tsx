import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

export interface SearchItem {
  group: "Pages" | "Lessons" | "Grammar points" | "Glossary"
  title: string
  subtitle?: string
  href: string
  keywords?: string
}

const GROUPS: SearchItem["group"][] = ["Lessons", "Grammar points", "Glossary", "Pages"]

/** Marks where the title ends inside an item's searchable value. */
const TITLE_END = " || "

/**
 * Every typed word must appear in the item (no fuzzy letter-skipping, which ranked
 * "Prepositions" above "present simple"). Matches at the start of a word, and in the
 * title, rank higher.
 */
export function searchScore(value: string, search: string): number {
  const words = search.toLowerCase().split(/[\s/]+/).filter(Boolean)
  if (!words.length) return 1
  const text = value.toLowerCase()
  const title = text.split(TITLE_END)[0]
  let score = 0
  for (const w of words) {
    const at = text.indexOf(w)
    if (at < 0) return 0
    const wordStart = at === 0 || /[^a-z0-9']/.test(text[at - 1])
    score += (wordStart ? 2 : 1) + (title.includes(w) ? 2 : 0)
  }
  // "present" should list "Present simple…" before "Mixed conditional: … present result".
  if (title.replace(/^[a-c][12]\.\d+\s+/, "").startsWith(words[0])) score += words.length * 2
  return score / (words.length * 4)
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<SearchItem[] | null>(null)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  React.useEffect(() => {
    if (!open || items) return
    fetch("/search-index.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [open, items])

  return (
    <>
      <Button
        variant="outline"
        className="min-w-0 max-w-xs flex-1 shrink justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} data-icon="inline-start" />
        <span className="truncate">Search grammar…</span>
        <KbdGroup className="ml-auto hidden sm:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search grammar"
        description="Find any lesson, grammar point or grammar term"
      >
        <Command filter={searchScore}>
          <CommandInput placeholder="Try “present perfect”, “a/an”, “inversion”…" />
          <CommandList>
          <CommandEmpty>{items ? "Nothing found." : "Loading…"}</CommandEmpty>
          {items &&
            GROUPS.map((group) => {
              const groupItems = items.filter((i) => i.group === group)
              if (!groupItems.length) return null
              return (
                <CommandGroup key={group} heading={group}>
                  {groupItems.map((item) => (
                    <CommandItem
                      key={`${group}-${item.href}-${item.title}`}
                      value={`${item.title}${TITLE_END}${item.subtitle ?? ""} ${item.keywords ?? ""} ${group}`}
                      onSelect={() => {
                        window.location.href = item.href
                      }}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{item.title}</span>
                        {item.subtitle && (
                          <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
