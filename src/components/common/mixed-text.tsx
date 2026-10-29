import React from "react";

import { splitPersianRuns } from "@/lib/bidi";
import { withOffsetKeys } from "@/lib/keys";

/** Renders English text that may contain Persian words, isolating each Persian run. */
export function MixedText({ text }: { text: string }) {
  return (
    <>
      {withOffsetKeys(splitPersianRuns(text), (run) => run.text.length).map(
        ({ item: p, key }) =>
          p.fa ? (
            <bdi className="fa" dir="rtl" key={key} lang="fa">
              {p.text}
            </bdi>
          ) : (
            <React.Fragment key={key}>{p.text}</React.Fragment>
          )
      )}
    </>
  );
}
