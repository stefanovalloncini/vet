import { Text } from "@react-pdf/renderer";
import { ensureFontsRegistered } from "./fonts";
import { AziendaHeader } from "./shared/AziendaHeader";
import { PdfShell } from "./shared/PdfShell";
import { RiepilogoTable } from "./shared/RiepilogoTable";
import { styles } from "./styles";
import type { ProformaPdfData } from "./shared/types";

ensureFontsRegistered();

interface ProformaDocumentProps {
  data: ProformaPdfData;
}

export function ProformaDocument({ data }: ProformaDocumentProps) {
  const { azienda, righe, periodo, emessoIl, emessoDa, totale } = data;

  return (
    <PdfShell
      title="Proforma prestazioni"
      subject="Proforma — non è una fattura"
      emessoIl={emessoIl}
      author={emessoDa.displayName}
    >
      <Text style={styles.watermark} fixed>
        BOZZA
      </Text>

      <AziendaHeader
        title="PROFORMA — non è una fattura"
        subtitle="Anteprima del conto, soggetta a revisione"
        azienda={azienda}
        periodo={periodo}
        emessoIl={emessoIl}
        rightMeta={[
          { label: "Emesso da", value: emessoDa.displayName },
        ]}
      />

      <RiepilogoTable righe={righe} totale={totale} />
    </PdfShell>
  );
}
