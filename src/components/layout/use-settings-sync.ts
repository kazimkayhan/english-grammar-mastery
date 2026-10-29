import { useEffect } from "react";

import { $settings, applySettings, loadSettings } from "@/stores/settings";

/** Keeps <html> in sync with settings, including live system light/dark changes. */
export function useSettingsSync() {
  useEffect(() => {
    loadSettings();
    applySettings($settings.get());
    const unsubscribe = $settings.listen(applySettings);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if ($settings.get().theme === "system") {
        applySettings($settings.get());
      }
    };
    media.addEventListener("change", onSystemChange);
    return () => {
      unsubscribe();
      media.removeEventListener("change", onSystemChange);
    };
  }, []);
}
