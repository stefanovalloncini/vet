import { useMemo, useState } from "react";
import {
  AppShell,
  Card,
  Select,
  TextField,
} from "../../../shared/ui";
import { DOSAGE_PRESETS, strumentiI18n as t } from "../i18n";

const mlFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function DosaggioPage() {
  const [presetId, setPresetId] = useState("custom");
  const [peso, setPeso] = useState("");
  const [dose, setDose] = useState("");
  const [conc, setConc] = useState("");

  const ml = useMemo(() => {
    const p = Number(peso);
    const d = Number(dose);
    const c = Number(conc);
    if (!isFinite(p) || !isFinite(d) || !isFinite(c)) return null;
    if (p <= 0 || d <= 0 || c <= 0) return null;
    const value = (p * d) / c;
    return Math.round(value * 100) / 100;
  }, [peso, dose, conc]);

  const presetOptions = DOSAGE_PRESETS.map((p) => ({
    value: p.id,
    label: p.label,
  }));

  function onPresetChange(id: string) {
    setPresetId(id);
    const preset = DOSAGE_PRESETS.find((p) => p.id === id);
    if (preset && preset.id !== "custom") {
      setDose(String(preset.dosaggioMgPerKg));
      setConc(String(preset.concentrazioneMgPerMl));
    }
  }

  return (
    <AppShell>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl text-(--color-text)">{t.dosaggioTitle}</h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">
          {t.dosaggioSubtitle}
        </p>
      </header>

      <Card className="max-w-2xl">
        <div className="space-y-5">
          <Select
            id="preset"
            label={t.preset}
            value={presetId}
            options={presetOptions}
            onChange={(e) => onPresetChange(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              id="peso"
              type="number"
              step="1"
              min="1"
              max="2000"
              label={t.pesoLabel}
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="es. 600"
            />
            <TextField
              id="dose"
              type="number"
              step="0.1"
              min="0"
              label={t.dosaggioLabel}
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
            <TextField
              id="conc"
              type="number"
              step="0.1"
              min="0"
              label={t.concentrazioneLabel}
              value={conc}
              onChange={(e) => setConc(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-(--color-border)">
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              {t.risultatoLabel}
            </p>
            <p className="text-4xl tabular-nums mt-2 text-(--color-text)">
              {ml !== null ? (
                <>
                  <span className="font-medium">{formatMl(ml)}</span>
                  <span className="text-base text-(--color-text-muted) ml-2">ml</span>
                </>
              ) : (
                <span className="text-(--color-text-subtle) text-2xl">—</span>
              )}
            </p>
            {(() => {
              const preset = DOSAGE_PRESETS.find((p) => p.id === presetId);
              if (!preset || preset.id === "custom") return null;
              return (
                <dl className="grid grid-cols-3 gap-4 mt-5 text-sm">
                  {preset.via ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                        Via
                      </dt>
                      <dd className="text-(--color-text) mt-1">{preset.via}</dd>
                    </div>
                  ) : null}
                  {preset.sospensioneCarne !== undefined ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                        {t.sospensione} {t.sospensioneCarne}
                      </dt>
                      <dd className="text-(--color-text) mt-1 tabular-nums">
                        {preset.sospensioneCarne === -1
                          ? "Non utilizzare"
                          : `${preset.sospensioneCarne} ${t.giorni}`}
                      </dd>
                    </div>
                  ) : null}
                  {preset.sospensioneLatte !== undefined ? (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                        {t.sospensione} {t.sospensioneLatte}
                      </dt>
                      <dd className="text-(--color-text) mt-1 tabular-nums">
                        {preset.sospensioneLatte === -1
                          ? "Vietato in lattazione"
                          : preset.sospensioneLatte === 0
                          ? "0 (no sospensione)"
                          : `${preset.sospensioneLatte} ${t.giorni}`}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              );
            })()}
          </div>

          <p className="text-xs text-(--color-text-subtle) -mt-1">
            {t.hint}
          </p>
        </div>
      </Card>
    </AppShell>
  );
}

function formatMl(n: number): string {
  return mlFormatter.format(n);
}
