import { useStore } from "@nanostores/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpen01Icon, ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { $settings, updateSettings, type ThemeChoice } from "@/stores/settings"

const THEMES: { value: ThemeChoice; label: string; hint: string; icon: typeof Sun01Icon }[] = [
  { value: "system", label: "System", hint: "Follow your device", icon: ComputerIcon },
  { value: "paper", label: "Paper", hint: "Warm ivory, daytime", icon: Sun01Icon },
  { value: "sepia", label: "Sepia", hint: "Softer, evening reading", icon: BookOpen01Icon },
  { value: "night", label: "Night", hint: "Soft charcoal, no glare", icon: Moon02Icon },
]

export function ThemeToggle() {
  const settings = useStore($settings)
  const current = THEMES.find((t) => t.value === settings.theme) ?? THEMES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Change theme" />}>
        <HugeiconsIcon icon={current.icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Reading theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={settings.theme}
            onValueChange={(value) => updateSettings({ theme: value as ThemeChoice })}
          >
            {THEMES.map((theme) => (
              <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                <HugeiconsIcon icon={theme.icon} strokeWidth={2} />
                <span className="flex flex-col">
                  <span>{theme.label}</span>
                  <span className="text-xs text-muted-foreground">{theme.hint}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
