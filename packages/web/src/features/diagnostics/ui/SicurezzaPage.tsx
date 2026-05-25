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
      <ul className="space-y-3">
        {ORDER.map((name) => {
          const r = results.find((x) => x.name === name);
          return (
            <li key={name} className="flex items-start gap-3 text-sm">
              <span aria-hidden className="mt-0.5">
                {r ? (r.ok ? "✓" : "✗") : "…"}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    r && !r.ok
                      ? "text-(--color-danger)"
                      : "text-(--color-text)"
                  }
                >
                  {t.probes[name]}
                </div>
                {r && !r.ok && r.reason ? (
                  <div className="text-xs text-(--color-text-subtle) mt-0.5 break-words">
                    {r.reason}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

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
