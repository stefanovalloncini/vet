import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

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

  return (
    <div className="mb-6 relative pr-16">
      <p className="text-sm text-(--color-text-muted)">
        {renderCopy(hasAziende, hasAttivita)}
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-0 top-0 text-xs text-(--color-text-subtle) hover:text-(--color-text) focus:outline-none focus-visible:underline underline-offset-4"
      >
        Nascondi
      </button>
    </div>
  );
}

function renderCopy(hasAziende: boolean, hasAttivita: boolean): ReactNode {
  if (!hasAziende && !hasAttivita) {
    return (
      <>
        Per iniziare,{" "}
        <InlineLink to="/aziende/nuova">{"crea un'azienda"}</InlineLink>, poi{" "}
        <InlineLink to="/attivita/nuova">
          {"registra un'attività"}
        </InlineLink>
        .
      </>
    );
  }
  if (!hasAziende) {
    return (
      <>
        {"Manca l'anagrafica: "}
        <InlineLink to="/aziende/nuova">{"crea un'azienda"}</InlineLink>.
      </>
    );
  }
  return (
    <>
      Nessuna attività ancora:{" "}
      <InlineLink to="/attivita/nuova">registra la prima</InlineLink>.
    </>
  );
}

function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-(--color-accent) hover:underline">
      {children}
    </Link>
  );
}
