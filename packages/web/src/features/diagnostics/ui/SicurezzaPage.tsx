import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Spinner } from "../../../shared/ui";
import { CenteredAuthLayout } from "../../auth/ui/CenteredAuthLayout";
import {
  probeAppCheckToken,
  probeCookies,
  probeLocalStorage,
  type ProbeName,
  type ProbeResult,
} from "../lib/probes";
import { diagI18n as t } from "../i18n";

const ORDER: ReadonlyArray<ProbeName> = ["cookies", "localStorage", "appCheckToken"];

export function SicurezzaPage() {
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [running, setRunning] = useState(true);

  const run = useCallback(async () => {
    setResults([]);
    setRunning(true);
    const collected: ProbeResult[] = [];
    for (const name of ORDER) {
      let r: ProbeResult;
      if (name === "cookies") r = await probeCookies();
      else if (name === "localStorage") r = await probeLocalStorage();
      else r = await probeAppCheckToken();
      collected.push(r);
      setResults([...collected]);
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const allOk =
    !running && results.length === ORDER.length && results.every((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  return (
    <CenteredAuthLayout
      title={t.title}
      subtitle={t.subtitle}
      footer={<span>{t.eyebrow}</span>}
    >
      <ul
        aria-busy={running}
        className="rounded-xl border border-(--color-border) bg-(--color-surface) divide-y divide-(--color-border) overflow-hidden"
      >
        {ORDER.map((name) => {
          const r = results.find((x) => x.name === name);
          return (
            <ProbeRow
              key={name}
              label={t.probes[name]}
              result={r}
              running={running}
            />
          );
        })}
      </ul>

      <div role="status" aria-live="polite">
        {running ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-(--color-text-muted)">
            <Spinner size={14} /> {t.running}
          </div>
        ) : null}

        {!running && failed.length > 0 ? (
          <div className="mt-6 border border-(--color-danger)/30 rounded-xl p-4 text-sm text-(--color-text) space-y-2">
            {failed.map((r) => (
              <p key={r.name}>{t.remediation[r.name]}</p>
            ))}
          </div>
        ) : null}

        {!running && allOk ? (
          <p className="mt-6 text-sm text-(--color-accent)">{t.allOk}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        <Link
          to="/login"
          className="text-sm font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          {t.backToLogin}
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={running}
          onClick={() => void run()}
        >
          {t.retry}
        </Button>
      </div>
    </CenteredAuthLayout>
  );
}

interface ProbeRowProps {
  label: string;
  result: ProbeResult | undefined;
  running: boolean;
}

function ProbeRow({ label, result, running }: ProbeRowProps) {
  const status: "pending" | "ok" | "fail" = result
    ? result.ok
      ? "ok"
      : "fail"
    : "pending";
  return (
    <li className="px-4 py-3 flex items-start gap-3 text-sm">
      <StatusDot status={status} running={running && !result} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={
              status === "fail" ? "text-(--color-danger)" : "text-(--color-text)"
            }
          >
            {label}
          </span>
          <span
            className={[
              "text-[11px] uppercase tracking-wider font-mono tabular-nums",
              status === "ok"
                ? "text-(--color-success)"
                : status === "fail"
                  ? "text-(--color-danger)"
                  : "text-(--color-text-subtle)",
            ].join(" ")}
          >
            {status === "ok" ? "ok" : status === "fail" ? "fail" : "…"}
          </span>
        </div>
        {result && !result.ok && result.reason ? (
          <p className="text-xs text-(--color-text-subtle) mt-1 font-mono break-words">
            {result.reason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

interface StatusDotProps {
  status: "pending" | "ok" | "fail";
  running: boolean;
}

function StatusDot({ status, running }: StatusDotProps) {
  const cls = [
    "mt-1.5 h-2 w-2 rounded-full flex-shrink-0",
    status === "ok"
      ? "bg-(--color-success)"
      : status === "fail"
        ? "bg-(--color-danger)"
        : running
          ? "bg-(--color-accent) animate-pulse motion-reduce:animate-none"
          : "bg-(--color-text-subtle)",
  ].join(" ");
  return <span aria-hidden="true" className={cls} />;
}
