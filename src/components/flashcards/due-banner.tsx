import { Cards01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDueCount } from "@/components/flashcards/due-count";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Home page reminder: shown only when flashcards are waiting. */
export function DueBanner() {
  const count = useDueCount();
  if (!count) {
    return null;
  }
  return (
    <Alert className="max-w-2xl">
      <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} />
      <AlertTitle>
        {count} {count === 1 ? "flashcard is" : "flashcards are"} waiting for
        you
      </AlertTitle>
      <AlertDescription>
        Start today with your 10-minute review.
      </AlertDescription>
      <AlertAction>
        <Button
          nativeButton={false}
          render={<a href="/flashcards" />}
          size="sm"
        >
          Review
        </Button>
      </AlertAction>
    </Alert>
  );
}
