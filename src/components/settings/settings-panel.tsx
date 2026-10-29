import {
  Delete02Icon,
  Download01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@nanostores/react";
import { useRef } from "react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { db } from "@/lib/db";
import { exportBackup, importBackup } from "@/lib/srs";
import { plural } from "@/lib/text";
import {
  $settings,
  type PersianMode,
  type ThemeChoice,
  updateSettings,
} from "@/stores/settings";

const PERSIAN_OPTIONS: {
  value: PersianMode;
  title: string;
  description: string;
}[] = [
  {
    description:
      "Full Persian explanations at A1–A2, short tips at B1–B2, English only at C1–C2.",
    title: "Auto: fades by level (recommended)",
    value: "auto",
  },
  {
    description:
      "Like Auto, plus the Persian notes on Grammar Tips traps at every level.",
    title: "Always",
    value: "always",
  },
  {
    description: "Hide all Persian. English only, everywhere.",
    title: "Off",
    value: "never",
  },
];

export function SettingsPanel() {
  const s = useStore($settings);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `grammar-flashcards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.add({
      description: `${plural(backup.cards.length, "flashcard")} saved.`,
      title: "Backup downloaded",
      type: "success",
    });
  };

  const upload = async (file: File) => {
    try {
      const count = await importBackup(JSON.parse(await file.text()));
      toast.add({
        description: `${plural(count, "flashcard")} imported.`,
        title: "Backup restored",
        type: "success",
      });
    } catch (e) {
      toast.add({
        description: (e as Error).message,
        title: "Couldn't import",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Reading comfort</CardTitle>
          <CardDescription>
            Choose what's easiest on your eyes. Saved in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Theme</FieldLabel>
              <ToggleGroup
                aria-label="Theme"
                onValueChange={(v) =>
                  v[0] && updateSettings({ theme: v[0] as ThemeChoice })
                }
                value={[s.theme]}
                variant="outline"
              >
                <ToggleGroupItem value="system">System</ToggleGroupItem>
                <ToggleGroupItem value="paper">Paper</ToggleGroupItem>
                <ToggleGroupItem value="sepia">Sepia</ToggleGroupItem>
                <ToggleGroupItem value="night">Night</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                Paper for daytime, Sepia for long evening reading, Night for low
                light.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>
                Lesson text size{" "}
                <span className="text-muted-foreground tabular-nums">
                  {Math.round(s.fontScale * 100)}%
                </span>
              </FieldLabel>
              <Slider
                aria-label="Lesson text size"
                max={1.35}
                min={0.85}
                onValueChange={(v) =>
                  updateSettings({ fontScale: Array.isArray(v) ? v[0] : v })
                }
                step={0.05}
                value={[s.fontScale]}
              />
              <p
                className="font-reading text-muted-foreground"
                style={{ fontSize: `calc(1.125rem * ${s.fontScale})` }}
              >
                She's from Shiraz. She's a nurse.
              </p>
            </Field>

            <Field>
              <FieldLabel>Reading font</FieldLabel>
              <ToggleGroup
                aria-label="Reading font"
                onValueChange={(v) =>
                  v[0] &&
                  updateSettings({ readingFont: v[0] as "sans" | "serif" })
                }
                value={[s.readingFont]}
                variant="outline"
              >
                <ToggleGroupItem className="font-sans" value="sans">
                  Atkinson (clear)
                </ToggleGroupItem>
                <ToggleGroupItem className="font-serif" value="serif">
                  Literata (bookish)
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                Atkinson Hyperlegible is designed so similar letters never look
                alike.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="focus-mode">Focus mode</FieldLabel>
                <FieldDescription>
                  Hide the sidebar while you read.
                </FieldDescription>
              </FieldContent>
              <Switch
                aria-label="Focus mode"
                checked={s.focus}
                id="focus-mode"
                onCheckedChange={(focus) => updateSettings({ focus })}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Persian support · پشتیبانی فارسی</CardTitle>
          <CardDescription>
            How much Persian help the lessons show.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend className="sr-only">Persian support</FieldLegend>
            <RadioGroup
              onValueChange={(v) =>
                updateSettings({ persian: v as PersianMode })
              }
              value={s.persian}
            >
              {PERSIAN_OPTIONS.map((o) => (
                <FieldLabel htmlFor={`persian-${o.value}`} key={o.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{o.title}</FieldTitle>
                      <FieldDescription>{o.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      aria-label={o.title}
                      id={`persian-${o.value}`}
                      value={o.value}
                    />
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
          <CardDescription>
            Your flashcards live only in this browser. Back them up to move them
            to another device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                New cards per day{" "}
                <span className="text-muted-foreground tabular-nums">
                  {s.newCardsPerDay}
                </span>
              </FieldLabel>
              <Slider
                aria-label="New cards per day"
                max={60}
                min={5}
                onValueChange={(v) =>
                  updateSettings({
                    newCardsPerDay: Array.isArray(v) ? v[0] : v,
                  })
                }
                step={5}
                value={[s.newCardsPerDay]}
              />
              <FieldDescription>
                About 20 new cards fit a 10-minute daily review.
              </FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={download} variant="outline">
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={Download01Icon}
                  strokeWidth={2}
                />
                Download backup
              </Button>
              <Button
                onClick={() => fileRef.current?.click()}
                variant="outline"
              >
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={Upload01Icon}
                  strokeWidth={2}
                />
                Restore backup
              </Button>
              <input
                accept="application/json,.json"
                aria-label="Backup file"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    upload(file);
                  }
                  e.target.value = "";
                }}
                ref={fileRef}
                type="file"
              />
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <HugeiconsIcon
                    data-icon="inline-start"
                    icon={Delete02Icon}
                    strokeWidth={2}
                  />
                  Delete all flashcards
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all flashcards?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes every card and its schedule from this
                      browser. Download a backup first if you might want them
                      back.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await db.cards.clear();
                        toast.add({
                          title: "All flashcards deleted",
                          type: "success",
                        });
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
  );
}
