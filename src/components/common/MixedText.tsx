import * as React from "react"

import { splitPersianRuns } from "@/lib/bidi"

/** Renders English text that may contain Persian words, isolating each Persian run. */
export function MixedText({ text }: { text: string }) {
  return (
    <>
      {splitPersianRuns(text).map((p, i) =>
        p.fa ? (
          <bdi key={i} dir="rtl" lang="fa" className="fa">
            {p.text}
          </bdi>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </>
  )
}
