import { HugeiconsIcon } from "@hugeicons/react"
import { Cards01Icon } from "@hugeicons/core-free-icons"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useDueCount } from "@/components/flashcards/DueCount"

/** Home page reminder: shown only when flashcards are waiting. */
export function DueBanner() {
  const count = useDueCount()
  if (!count) return null
  return (
    <Alert className="max-w-2xl">
      <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} />
      <AlertTitle>
        {count} {count === 1 ? "flashcard is" : "flashcards are"} waiting for you
      </AlertTitle>
      <AlertDescription>Start today with your 10-minute review.</AlertDescription>
      <AlertAction>
        <Button size="sm" render={<a href="/flashcards" />} nativeButton={false}>
          Review
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default DueBanner
