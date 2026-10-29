import { map } from "nanostores";

export type ThemeChoice = "system" | "paper" | "sepia" | "night";
export type PersianMode = "auto" | "always" | "never";

export interface Settings {
  focus: boolean;
  fontScale: number;
  newCardsPerDay: number;
  persian: PersianMode;
  readingFont: "sans" | "serif";
  theme: ThemeChoice;
}

export const SETTINGS_KEY = "egm-settings";

export const DEFAULT_SETTINGS: Settings = {
  focus: false,
  fontScale: 1,
  newCardsPerDay: 20,
  persian: "auto",
  readingFont: "sans",
  theme: "system",
};

function readSaved(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Starts with defaults on server and client alike (so hydration matches),
// then loadSettings() swaps in the saved values after the first render.
export const $settings = map<Settings>(DEFAULT_SETTINGS);

export function loadSettings() {
  $settings.set(readSaved());
}

export function resolveTheme(
  theme: ThemeChoice
): Exclude<ThemeChoice, "system"> {
  if (theme !== "system") {
    return theme;
  }
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "paper";
}

/** Mirror settings onto <html> so pure CSS can react (theme, font, Persian, focus). */
export function applySettings(s: Settings) {
  const root = document.documentElement;
  const theme = resolveTheme(s.theme);
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "night");
  root.dataset.readingFont = s.readingFont;
  root.dataset.persian = s.persian;
  root.dataset.focus = s.focus ? "on" : "off";
  root.style.setProperty("--font-scale", String(s.fontScale));
}

export function updateSettings(patch: Partial<Settings>) {
  const next = { ...$settings.get(), ...patch };
  $settings.set(next);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: settings still apply for this visit.
  }
  applySettings(next);
}
