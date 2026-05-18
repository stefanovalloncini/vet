import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../shared/ui";

const STORAGE_KEY = "vet.onboardingDismissed";

interface OnboardingBannerProps {
  hasAziende: boolean;
  hasAttivita: boolean;
}

export function OnboardingBanner({ hasAziende, hasAttivita }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => window.localStorage.getItem(STORAGE_KEY) === "1"
  );

  if (dismissed || (hasAziende && hasAttivita)) return null;

  const steps = [
    {
      done: hasAziende,
      title: "Inserisci il primo allevamento",
      to: "/aziende/nuova",
      cta: "Aggiungi azienda",
    },
    {
      done: hasAttivita,
      title: "Registra la prima visita",
      to: "/attivita/nuova",
      cta: "Nuova attività",
    },
  ];

  return (
    <Card className="mb-4 border-(--color-accent)/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
            Iniziamo
          </p>
          <h2 className="text-base font-medium text-(--color-text) mt-1">
            Tre passi per partire
          </h2>
          <ol className="space-y-2 mt-3">
            {steps.map((s) => (
              <li key={s.title} className="flex items-center gap-3 text-sm">
                <span
                  className={[
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0",
                    s.done
                      ? "bg-(--color-accent) text-white"
                      : "border border-(--color-border) text-(--color-text-muted)",
                  ].join(" ")}
                >
                  {s.done ? "✓" : ""}
                </span>
                <span
                  className={
                    s.done ? "text-(--color-text-muted) line-through" : "text-(--color-text)"
                  }
                >
                  {s.title}
                </span>
                {!s.done ? (
                  <Link
                    to={s.to}
                    className="ml-auto text-xs text-(--color-accent) hover:underline"
                  >
                    {s.cta} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="text-xs text-(--color-text-muted) hover:text-(--color-text) flex-shrink-0"
        >
          Nascondi
        </button>
      </div>
    </Card>
  );
}
