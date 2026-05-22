import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActorContext, AziendeRepository } from "@vet/shared";
import { AppShell, Button, Card, PageHeader, TextArea } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { parseAziendeCsv, type ParsedRow } from "../lib/parser";

interface ImportInput {
  rows: ReadonlyArray<ParsedRow>;
  actor: ActorContext;
}

interface ImportOutcome {
  created: number;
  skipped: number;
}

async function runImport(
  repo: AziendeRepository,
  { rows, actor }: ImportInput
): Promise<ImportOutcome> {
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.ok || !row.input) { skipped++; continue; }
    try {
      const norm = row.input.nome.trim().toLowerCase();
      const existing = await repo.findByNomeNorm(norm);
      if (existing) { skipped++; continue; }
      await repo.create(row.input, actor);
      created++;
    } catch {
      skipped++;
    }
  }
  return { created, skipped };
}

export function ImportAziendePage() {
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const qc = useQueryClient();
  const importer = useMutation({
    mutationFn: (input: ImportInput) => runImport(repo, input),
    onSuccess: (outcome) => {
      if (outcome.created > 0) void qc.invalidateQueries({ queryKey: ["aziende"] });
    },
  });
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<ImportOutcome | null>(null);

  const canCreate = user?.caps.has("aziende.create") ?? false;
  const busy = importer.isPending;

  function handleParse() {
    setResult(null);
    setRows(parseAziendeCsv(text));
  }

  async function handleImport() {
    if (!user || !canCreate) return;
    setResult(null);
    const outcome = await importer.mutateAsync({ rows, actor: user });
    setResult(outcome);
    if (outcome.created > 0) {
      setText("");
      setRows([]);
    }
  }

  const validCount = rows.filter((r) => r.ok).length;

  return (
    <AppShell>
      <PageHeader
        title="Importa aziende"
        subtitle="Incolla un CSV (separatore ; o ,). Colonne supportate: nome, indirizzo, telefono, piva, tipoAllevamento, numeroCapi, note."
      />
      <Card className="mb-4">
        <TextArea
          id="csv"
          label="CSV"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={`nome;indirizzo;telefono;piva;tipoAllevamento;numeroCapi\nCascina Verde;Via Roma 1;0123456789;;bovini;80`}
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-(--color-text-muted)">
            {rows.length === 0
              ? "Anteprima vuota"
              : `${validCount} righe valide / ${rows.length} totali`}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={handleParse}>
              Anteprima
            </Button>
            {canCreate ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleImport}
                disabled={busy || validCount === 0}
              >
                {busy ? "Import…" : `Importa ${validCount}`}
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
      {result ? (
        <Card className="mb-4 border-(--color-accent)/40">
          <p className="text-sm text-(--color-text)">
            Importati {result.created} · saltati {result.skipped}
          </p>
        </Card>
      ) : null}
      {rows.length > 0 ? (
        <Card padded={false}>
          <ul className="divide-y divide-(--color-border)">
            {rows.map((r) => (
              <li key={r.line} className="px-5 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={
                      r.ok ? "text-(--color-text)" : "text-(--color-danger)"
                    }
                  >
                    {r.input?.nome ?? "?"}
                  </span>
                  <span className="text-xs text-(--color-text-subtle) tabular-nums">
                    riga {r.line}
                  </span>
                </div>
                {r.error ? (
                  <p className="text-xs text-(--color-danger) mt-1">{r.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </AppShell>
  );
}
