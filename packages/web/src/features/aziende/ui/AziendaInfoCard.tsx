import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, SectionLabel } from "../../../shared/ui";
import { sanitizeTel } from "../lib/sanitizeTel";
import { formatEuro } from "../../../shared/lib/format";
import type { Azienda } from "@vet/shared";
import { TagsEditor } from "./TagsEditor";

const integerFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
});

interface AziendaInfoCardProps {
  azienda: Azienda;
  total: number;
  paidTotal: number;
  tags: ReadonlyArray<string>;
  onTagsChange: (next: string[]) => void;
  canExport: boolean;
}

export function AziendaInfoCard({
  azienda,
  total,
  paidTotal,
  tags,
  onTagsChange,
  canExport,
}: AziendaInfoCardProps) {
  return (
    <Card>
      <SectionLabel className="mb-3">Anagrafica</SectionLabel>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {azienda.tipoAllevamento ? (
          <Field label="Allevamento" value={azienda.tipoAllevamento} capitalize />
        ) : null}
        {azienda.numeroCapi !== undefined ? (
          <Field
            label="Capi"
            value={integerFormatter.format(azienda.numeroCapi)}
            tabular
          />
        ) : null}
        {azienda.telefono ? (
          <TelefonoField raw={azienda.telefono} />
        ) : null}
        {azienda.piva ? (
          <Field label="P.IVA" value={azienda.piva} mono />
        ) : null}
        <Field label="Totale storico" value={formatEuro(total)} tabular emphasized />
        <Field label="Incassato" value={formatEuro(paidTotal)} tabular emphasized />
      </dl>
      {azienda.note ? (
        <p className="text-sm text-(--color-text-muted) mt-4 pt-4 border-t border-(--color-border) whitespace-pre-line break-words">
          {azienda.note}
        </p>
      ) : null}
      <div className="mt-4 pt-4 border-t border-(--color-border)">
        <TagsEditor tags={tags} onChange={onTagsChange} />
      </div>
      {canExport ? (
        <div className="mt-4 pt-4 border-t border-(--color-border)">
          <Link
            to={`/aziende/${azienda.id}/riepilogo`}
            className="inline-flex items-center gap-1 rounded text-sm text-(--color-accent) hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
          >
            Apri riepilogo stampabile
            <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

interface FieldProps {
  label: string;
  value: string;
  capitalize?: boolean;
  tabular?: boolean;
  mono?: boolean;
  emphasized?: boolean;
}

function Field({ label, value, capitalize, tabular, mono, emphasized }: FieldProps) {
  const cls = [
    "text-(--color-text) mt-1 break-words",
    capitalize ? "capitalize" : "",
    tabular ? "tabular-nums" : "",
    mono ? "font-mono text-xs" : "",
    emphasized ? "font-medium" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="min-w-0">
      <SectionLabel as="dt">{label}</SectionLabel>
      <dd className={cls}>{value}</dd>
    </div>
  );
}

function TelefonoField({ raw }: { raw: string }) {
  const tel = sanitizeTel(raw);
  return (
    <div className="min-w-0">
      <SectionLabel as="dt">Telefono</SectionLabel>
      <dd className="text-(--color-text) mt-1 break-words">
        {tel ? (
          <a
            href={`tel:${tel}`}
            className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
          >
            {raw}
          </a>
        ) : (
          <span>{raw}</span>
        )}
      </dd>
    </div>
  );
}
