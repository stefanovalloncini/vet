import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
import { PdfShell } from "./shared/PdfShell";
import { RiepilogoTable } from "./shared/RiepilogoTable";
import type { RiepilogoPdfData } from "./shared/types";

ensureFontsRegistered();

interface RiepilogoDocumentProps {
  data: RiepilogoPdfData;
}

export function RiepilogoDocument({ data }: RiepilogoDocumentProps) {
  const { azienda, righe, periodo, emessoIl, vetName, totale } = data;

  return (
    <PdfShell
      title="Riepilogo prestazioni"
      subject="Riepilogo prestazioni veterinarie"
      emessoIl={emessoIl}
    >
      <AziendaHeader
        title="Riepilogo prestazioni"
        subtitle="Documento informativo non fiscale"
        azienda={azienda}
        periodo={periodo}
        emessoIl={emessoIl}
        {...(vetName
          ? { rightMeta: [{ label: "Veterinario", value: vetName }] }
          : {})}
      />

      <RiepilogoTable righe={righe} totale={totale} />
    </PdfShell>
  );
}
