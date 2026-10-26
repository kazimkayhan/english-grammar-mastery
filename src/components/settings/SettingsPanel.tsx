import * as React from "react"
import { useStore } from "@nanostores/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Download01Icon, Upload01Icon } from "@hugeicons/core-free-icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/toast"
import { db } from "@/lib/db"
import { exportBackup, importBackup } from "@/lib/srs"
import { plural } from "@/lib/text"
import { $settings, updateSettings, type PersianMode, type ThemeChoice } from "@/stores/settings"

const PERSIAN_OPTIONS: { value: PersianMode; title: string; description: string }[] = [
  {
    value: "auto",
    title: "Auto: fades by level (recommended)",
    description: "Full Persian explanations at A1–A2, short tips at B1–B2, English only at C1–C2.",
  },
  {
    value: "always",
    title: "Always",
    description: "Like Auto, plus the Persian notes on Persian Corner traps at every level.",
  },
  { value: "never", title: "Off", description: "Hide all Persian. English only, everywhere." },
]

export function SettingsPanel() {
  const s = useStore($settings)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const download = async () => {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `grammar-flashcards-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.add({ title: "Backup downloaded", description: `${plural(backup.cards.length, "flashcard")} saved.`, type: "success" })
  }

  const upload = async (file: File) => {
    try {
      const count = await importBackup(JSON.parse(await file.text()))
      toast.add({ title: "Backup restored", description: `${plural(count, "flashcard")} imported.`, type: "success" })
    } catch (e) {
      toast.add({ title: "Couldn't import", description: (e as Error).message, type: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Reading comfort</CardTitle>
          <CardDescription>Choose what's easiest on your eyes. Saved in this browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Theme</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[s.theme]}
                onValueChange={(v) => v[0] && updateSettings({ theme: v[0] as ThemeChoice })}
                aria-label="Theme"
              >
                <ToggleGroupItem value="system">System</ToggleGroupItem>
                <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
                <ToggleGroupItem value="sepia">Sepia</ToggleGroupItem>
                <ToggleGroupItem value="night">Night</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>Paper for daytime, Sepia for long evening reading, Night for low light.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                Lesson text size <span className="text-muted-foreground tabular-nums">{Math.round(s.fontScale * 100)}%</span>
              </FieldLabel>
              <Slider
                min={0.85}
                max={1.35}
                step={0.05}
                value={[s.fontScale]}
                onValueChange={(v) => updateSettings({ fontScale: Array.isArray(v) ? v[0] : v })}
                aria-label="Lesson text size"
              />
              <p className="font-reading text-muted-foreground" style={{ fontSize: `calc(1.125rem * ${s.fontScale})` }}>
                She's from Shiraz. She's a nurse.
              </p>
            </Field>

            <Field>
              <FieldLabel>Reading font</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[s.readingFont]}
                onValueChange={(v) => v[0] && updateSettings({ readingFont: v[0] as "sans" | "serif" })}
                aria-label="Reading font"
              >
                <ToggleGroupItem value="sans" className="font-sans">
                  Atkinson (clear)
                </ToggleGroupItem>
                <ToggleGroupItem value="serif" className="font-serif">
                  Literata (bookish)
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>Atkinson Hyperlegible is designed so similar letters never look alike.</FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="focus-mode">Focus mode</FieldLabel>
                <FieldDescription>Hide the sidebar while you read.</FieldDescription>
              </FieldContent>
              <Switch id="focus-mode" checked={s.focus} onCheckedChange={(focus) => updateSettings({ focus })} aria-label="Focus mode" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Persian support · پشتیبانی فارسی</CardTitle>
          <CardDescription>How much Persian help the lessons show.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend className="sr-only">Persian support</FieldLegend>
            <RadioGroup value={s.persian} onValueChange={(v) => updateSettings({ persian: v as PersianMode })}>
              {PERSIAN_OPTIONS.map((o) => (
                <FieldLabel key={o.value} htmlFor={`persian-${o.value}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{o.title}</FieldTitle>
                      <FieldDescription>{o.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={o.value} id={`persian-${o.value}`} aria-label={o.title} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
          <CardDescription>Your flashcards live only in this browser. Back them up to move them to another device.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                New cards per day <span className="text-muted-foreground tabular-nums">{s.newCardsPerDay}</span>
              </FieldLabel>
              <Slider
                min={5}
                max={60}
                step={5}
                value={[s.newCardsPerDay]}
                onValueChange={(v) => updateSettings({ newCardsPerDay: Array.isArray(v) ? v[0] : v })}
                aria-label="New cards per day"
              />
              <FieldDescription>About 20 new cards fit a 10-minute daily review.</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={download}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
                Download backup
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} data-icon="inline-start" />
                Restore backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Backup file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) upload(file)
                  e.target.value = ""
                }}
              />
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                  Delete all flashcards
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all flashcards?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes every card and its schedule from this browser. Download a backup first if you might want them
                      back.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await db.cards.clear()
                        toast.add({ title: "All flashcards deleted", type: "success" })
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPanel
