import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "../../../shared/ui";

const SLOW_AFTER_MS = 8000;
const DIAGNOSTIC_AFTER_MS = 15000;

export interface SlowAuthStage {
  atMs: number;
  label: string;
}

interface SlowAuthLoadingProps {
  label?: string;
  stages?: readonly SlowAuthStage[];
  diagnosticHref?: string;
}

export function SlowAuthLoading({
  label,
  stages,
  diagnosticHref = "/sicurezza",
}: SlowAuthLoadingProps) {
  const stageList = useMemo<readonly SlowAuthStage[]>(
    () =>
      stages && stages.length > 0
        ? stages
        : [{ atMs: 0, label: label ?? "Caricamento…" }],
    [stages, label]
  );
  const [stageIdx, setStageIdx] = useState(0);
  const [slow, setSlow] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    const stageTimers = stageList.slice(1).map((s, i) =>
      window.setTimeout(() => setStageIdx(i + 1), s.atMs)
    );
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    const diagTimer = window.setTimeout(
      () => setShowDiag(true),
      DIAGNOSTIC_AFTER_MS
    );
    return () => {
      stageTimers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(slowTimer);
      window.clearTimeout(diagTimer);
    };
  }, [stageList]);

  const currentLabel = stageList[stageIdx]?.label ?? "";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 text-center"
    >
      <Spinner size={28} label={currentLabel} />
      <div className="flex min-h-[2.5rem] flex-col items-center justify-start gap-2">
        {slow ? (
          <p className="text-sm text-(--color-text-muted) max-w-xs text-balance">
            Sta impiegando più del solito.
          </p>
        ) : null}
        {showDiag ? (
          <Link
            to={diagnosticHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
          >
            Esegui la verifica di sicurezza
          </Link>
        ) : null}
      </div>
    </div>
  );
}
