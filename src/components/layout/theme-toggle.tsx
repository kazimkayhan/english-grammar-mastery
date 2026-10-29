import {
  BookOpen01Icon,
  ComputerIcon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useStore } from "@nanostores/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { $settings, type ThemeChoice, updateSettings } from "@/stores/settings";

const THEMES: {
  value: ThemeChoice;
  label: string;
  hint: string;
  icon: typeof Sun01Icon;
}[] = [
  {
    hint: "Follow your device",
    icon: ComputerIcon,
    label: "System",
    value: "system",
  },
  {
    hint: "Warm ivory, daytime",
    icon: Sun01Icon,
    label: "Paper",
    value: "paper",
  },
  {
    hint: "Softer, evening reading",
    icon: BookOpen01Icon,
    label: "Sepia",
    value: "sepia",
  },
  {
    hint: "Soft charcoal, no glare",
    icon: Moon02Icon,
    label: "Night",
    value: "night",
  },
];

export function ThemeToggle() {
  const settings = useStore($settings);
  const current = THEMES.find((t) => t.value === settings.theme) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Change theme" size="icon" variant="ghost" />
        }
      >
        <HugeiconsIcon icon={current.icon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Reading theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) =>
              updateSettings({ theme: value as ThemeChoice })
            }
            value={settings.theme}
          >
            {THEMES.map((theme) => (
              <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                <HugeiconsIcon icon={theme.icon} strokeWidth={2} />
                <span className="flex flex-col">
                  <span>{theme.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {theme.hint}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
