import { useMemo, useState } from "react";
import {
  AppShell,
  Card,
  NumberField,
  PageHeader,
  SectionLabel,
  Select,
} from "../../../shared/ui";
import { DOSAGE_PRESETS, strumentiI18n as t, type DosagePreset } from "../i18n";

const mlFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MAX_PESO = 2000;
const MAX_RATE = 100000;

type Num = number | "";

export function DosaggioPage() {
  const [presetId, setPresetId] = useState("custom");
  const [peso, setPeso] = useState<Num>("");
  const [dose, setDose] = useState<Num>("");
  const [conc, setConc] = useState<Num>("");

  const ml = useMemo(() => computeMl(peso, dose, conc), [peso, dose, conc]);

  const presetOptions = DOSAGE_PRESETS.map((p) => ({
    value: p.id,
    label: p.label,
  }));
  const activePreset = DOSAGE_PRESETS.find((p) => p.id === presetId);

  function onPresetChange(id: string) {
    setPresetId(id);
    const preset = DOSAGE_PRESETS.find((p) => p.id === id);
    if (preset && preset.id !== "custom") {
      setDose(preset.dosaggioMgPerKg);
      setConc(preset.concentrazioneMgPerMl);
    }
  }

  return (
    <AppShell>
      <PageHeader title={t.dosaggioTitle} subtitle={t.dosaggioSubtitle} />

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
            <NumberField
              id="peso"
              label={t.pesoLabel}
              value={peso}
              onChange={setPeso}
              step={1}
              min={0}
              max={MAX_PESO}
              placeholder="600"
            />
            <NumberField
              id="dose"
              label={t.dosaggioLabel}
              value={dose}
              onChange={setDose}
              step={0.1}
              min={0}
              max={MAX_RATE}
            />
            <NumberField
              id="conc"
              label={t.concentrazioneLabel}
              value={conc}
              onChange={setConc}
              step={0.1}
              min={0}
              max={MAX_RATE}
            />
          </div>

          <div className="pt-4 border-t border-(--color-border)">
            <SectionLabel>{t.risultatoLabel}</SectionLabel>
            <p
              aria-live="polite"
              className="text-4xl tabular-nums mt-2 text-(--color-text) break-words"
            >
              {ml !== null ? (
                <>
                  <span className="font-medium">{mlFormatter.format(ml)}</span>
                  <span className="text-base text-(--color-text-muted) ml-2">
                    ml
                  </span>
                </>
              ) : (
                <span className="text-(--color-text-subtle) text-2xl">—</span>
              )}
            </p>
            <PresetDetails preset={activePreset} />
          </div>

          <p className="text-xs text-(--color-text-subtle) -mt-1 max-w-prose">
            {t.hint}
          </p>
        </div>
      </Card>
    </AppShell>
  );
}

function computeMl(peso: Num, dose: Num, conc: Num): number | null {
  if (peso === "" || dose === "" || conc === "") return null;
  if (!isFinite(peso) || !isFinite(dose) || !isFinite(conc)) return null;
  if (peso <= 0 || dose <= 0 || conc <= 0) return null;
  const value = (peso * dose) / conc;
  if (!isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

interface PresetDetailsProps {
  preset: DosagePreset | undefined;
}

function PresetDetails({ preset }: PresetDetailsProps) {
  if (!preset || preset.id === "custom") return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mt-5 text-sm">
      {preset.via ? (
        <div className="min-w-0">
          <SectionLabel as="dt">Via</SectionLabel>
          <dd className="text-(--color-text) mt-1">{preset.via}</dd>
        </div>
      ) : null}
      {preset.sospensioneCarne !== undefined ? (
        <div className="min-w-0">
          <SectionLabel as="dt">
            {t.sospensione} {t.sospensioneCarne}
          </SectionLabel>
          <dd className="text-(--color-text) mt-1 tabular-nums">
            {formatSospensioneCarne(preset.sospensioneCarne)}
          </dd>
        </div>
      ) : null}
      {preset.sospensioneLatte !== undefined ? (
        <div className="min-w-0">
          <SectionLabel as="dt">
            {t.sospensione} {t.sospensioneLatte}
          </SectionLabel>
          <dd className="text-(--color-text) mt-1 tabular-nums">
            {formatSospensioneLatte(preset.sospensioneLatte)}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function formatSospensioneCarne(days: number): string {
  if (days === -1) return "Non utilizzare";
  return `${days} ${t.giorni}`;
}

function formatSospensioneLatte(days: number): string {
  if (days === -1) return "Vietato in lattazione";
  if (days === 0) return "0 (no sospensione)";
  return `${days} ${t.giorni}`;
}
