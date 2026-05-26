import { useEffect, useState } from "react";

const HINT_AFTER_MS = 2000;
const RETRY_AFTER_MS = 5000;

interface GoogleSignInHintProps {
  busy: boolean;
  onRetry: () => void;
}

export function GoogleSignInHint({ busy, onRetry }: GoogleSignInHintProps) {
  const [stage, setStage] = useState<"idle" | "hint" | "retry">("idle");

  useEffect(() => {
    if (!busy) {
      setStage("idle");
      return undefined;
    }
    const hintId = window.setTimeout(() => setStage("hint"), HINT_AFTER_MS);
    const retryId = window.setTimeout(() => setStage("retry"), RETRY_AFTER_MS);
    return () => {
      window.clearTimeout(hintId);
      window.clearTimeout(retryId);
    };
  }, [busy]);

  if (stage === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="text-center text-xs text-(--color-text-muted) space-y-1"
    >
      <p>Apri la finestra di Google per continuare.</p>
      {stage === "retry" ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          Non si è aperta? Riprova.
        </button>
      ) : null}
    </div>
  );
}
