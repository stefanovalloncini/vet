import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { openQuickEntry } from "../quick-entry";

const inlineClass = "text-(--color-accent) hover:underline";

const STORAGE_KEY = "vet.onboardingDismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return;
  }
}

interface OnboardingBannerProps {
  hasAziende: boolean;
  hasAttivita: boolean;
}

export function OnboardingBanner({ hasAziende, hasAttivita }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || (hasAziende && hasAttivita)) return null;

  return (
    <div className="mb-6 relative pr-16">
      <p className="text-sm text-(--color-text-muted)">
        {renderCopy(hasAziende, hasAttivita)}
      </p>
      <button
        type="button"
        onClick={() => {
          persistDismissed();
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
        <InlineButton onClick={openQuickEntry}>
          {"registra un'attività"}
        </InlineButton>
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
      <InlineButton onClick={openQuickEntry}>registra la prima</InlineButton>.
    </>
  );
}

function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={inlineClass}>
      {children}
    </Link>
  );
}

function InlineButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={inlineClass}>
      {children}
    </button>
  );
}
